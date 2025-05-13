import React from "react";
import { StyleSheet, View } from "react-native";
import LottieView from "lottie-react-native";


const AsistanScreen: React.FC = () => {
    return (
        <View style={styles.container}>
            <LottieView
                source={require("C:/Users/Hp/Documents/GitHub/ClothCards/Animations/AiAsistant.json")} // JSON dosyasının tam yolu
                autoPlay
                loop
                style={styles.animation}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000", // Siyah arka plan
        justifyContent: "center",
        alignItems: "center",
    },
    animation: {
        width: 300,
        height: 300, // Animasyon boyutları
        bottom: 175,
        opacity: 0.9
    },
});

export default AsistanScreen;
