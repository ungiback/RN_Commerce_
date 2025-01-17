import React, { useState, useCallback, useEffect } from "react";
import { Text, Pressable, useWindowDimensions, Alert, ScrollView } from "react-native";
import OrderListItem from "../conponents/OrderListItem";
import { SafeAreaView } from 'react-native-safe-area-context';
import styled from "styled-components";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useTheme, useFocusEffect } from '@react-navigation/native'
import { Auth, Store } from "../firebaseConfig";
import { useDispatchContxt, useStateContxt } from "../conponents/BasketProvider";
import { Ionicons } from '@expo/vector-icons';

const Title = styled.View`
    flex:0.4;
    align-items:center;
    justify-content:center;
`;
const Middle = styled.View`
    flex:2;
    align-items:center;
    padding-top:30px;
`;
const Tail = styled.View`
    flex:0.4;
    align-items:center;
    justify-content:center;
    margin-bottom:${({ h }) => h}px;
`;
const Backbtn = styled.Pressable`
    align-items:flex-start;
    width:100%;
    position:absolute;
    padding-left:9px;
`;

const OrderPage = ({ navigation }) => {
    const { width } = useWindowDimensions()
    const bar_height = useBottomTabBarHeight()
    const { colors } = useTheme()
    const [logged, setLogged] = useState()

    const state = useStateContxt()
    const dispatch = useDispatchContxt()
    let total = 0
    state.map(item => total += item.count * item.price)

    useFocusEffect(
        useCallback(() => {
            const auth = Auth.getAuth()
            Auth.onAuthStateChanged(auth, (user) => {
                if (user) {
                    setLogged(true)
                }
                else {
                    setLogged(false)
                }
            })
        }, [])
    );

    const OrderBtn = async (navigation, logged) => {
        const today = new Date()
        function todeFormat(today) {
            const YYYY = today.getFullYear()
            const MM = (today.getMonth() + 1) < 10 ? '0' + (today.getMonth() + 1) : (today.getMonth() + 1)
            const DD = today.getDate() < 10 ? '0' + today.getDate() : today.getDate()

            return YYYY + "" + MM + "" + DD
        }
        const order_DATE = todeFormat(today)
        if (logged) {
            const User = Auth.getAuth().currentUser
            try {
                const orderRef = Store.doc(Store.getFirestore(), "Order", User.uid)
                const get_data = await Store.getDoc(Store.doc(Store.getFirestore(), "Order", User.uid))
                const get_history = get_data.data().order_history

                const dataSet = {
                    ...get_history,
                    [order_DATE]: Object.values(state)
                }
                await Store.updateDoc(orderRef, {
                    order_history: dataSet
                }).then(() => {
                    dispatch({ type: 'success' })
                    navigation.goBack()
                })
            } catch (error) {
                console.log(error)
            }
        } else {
            Alert.alert("로그인", '로그인필요함.', [
                { text: '확인', style: 'cancel' },
                //로그인 화면으로 이동 하기 할것 
            ])
        }
    }

    function onDeleteBtn(id) {
        dispatch({ type: 'delete', put_num: id })
    }
    return (
        <SafeAreaView style={{ flex: 1, alignItems: 'center', }}>
            <Title>
                <Backbtn onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={30} color="black" />
                </Backbtn>
                <Text style={{ fontSize: 30, }}>바구니</Text>
            </Title>
            <Middle>
                <ScrollView>
                    {state.map((item, idx) => <OrderListItem key={idx} item={item} num={idx}
                        onDeleteBtn={(id) => onDeleteBtn(id)}
                    />)}
                </ScrollView>
            </Middle>
            <Tail h={bar_height}>
                <Text style={{ fontSize: 30 }}>
                    합계 : {total}원
                </Text>
                <Pressable
                    style={{ backgroundColor: colors.button_color, width: width - 20 }}
                    onPress={() => OrderBtn(navigation, logged)}>
                    <Text style={{ fontSize: 24, textAlign: 'center' }}>
                        주문하기
                    </Text>
                </Pressable>
            </Tail>
        </SafeAreaView>
    )
}

export default OrderPage