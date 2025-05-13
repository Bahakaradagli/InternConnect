import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get("window");

const RectangleComponent = () => {
    return (
        <View style={styles.container}>
            <View style={styles.rectangle}>
                <View style={styles.spectatorArea}>
                    <View style={styles.spectators}></View>
                </View>
                <View style={styles.arenaBorderOval}>
                    <View style={styles.arenaBorder}>
                        <View style={styles.arenaMiddleCircle}></View>
                        <View style={styles.centerLine}></View>
                        <View style={[styles.penaltyBox, styles.upPenaltyBox]}></View>
                        <View style={[styles.penaltyBox, styles.downPenaltyBox]}></View>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject, // Arka plana yayılmasını sağlıyor
        justifyContent: 'center',
        alignItems: 'center',
    },
    rectangle: {
        width: width, // Genişlik
        height: height, // Yükseklik
        backgroundColor: 'white', // Saha rengi
        justifyContent: "center",
        alignItems: "center",
    },
    spectatorArea: {
        position: 'absolute',
        width: width * 0.98,
        height: height * 0.92,
        backgroundColor: '#1A1E24', // Seyirci alanı arka plan rengi
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 140,
    },
    spectators: {
        width: width * 0.9,
        height: height * 0.85,
        backgroundColor: '#3E434F', // Seyirci grupları rengi
        borderRadius: 130,
    },
    arenaBorderOval: {
        position: 'absolute',
        width: width * 0.85,
        height: height * 0.8,
        backgroundColor: '#2C333D',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 120,
    },
    arenaBorder: {
        height: height * 0.7,
        width: width * 0.75,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
    arenaMiddleCircle: {
        width: width * 0.25,
        height: width * 0.25,
        borderRadius: (width * 0.25) / 2,
        borderWidth: 2,
        borderColor: 'white',
        position: 'absolute',
    },
    centerLine: {
        width: width * 0.75,
        height: 2,
        backgroundColor: 'white',
        position: 'absolute',
    },
    penaltyBox: {
        width: width * 0.3,
        height: height * 0.08,
        borderWidth: 2,
        borderColor: 'white',
        position: 'absolute',
    },
    upPenaltyBox: {
        top: 0,
    },
    downPenaltyBox: {
        bottom: 0,
    },
});

export default RectangleComponent;