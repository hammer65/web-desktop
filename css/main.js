import React, {StyleSheet, Dimensions, PixelRatio} from "react-native";
const {width, height, scale} = Dimensions.get("window"),
    vw = width / 100,
    vh = height / 100,
    vmin = Math.min(vw, vh),
    vmax = Math.max(vw, vh);

export default StyleSheet.create({
    "body": {
        "overflow": "hidden",
        "marginTop": 0,
        "marginRight": 0,
        "marginBottom": 0,
        "marginLeft": 0,
        "paddingTop": 0,
        "paddingRight": 0,
        "paddingBottom": 0,
        "paddingLeft": 0
    },
    "control-bar": {
        "display": "flex",
        "alignItems": "flex-start",
        "paddingTop": 5,
        "paddingRight": 5,
        "paddingBottom": 5,
        "paddingLeft": 5,
        "borderBottom": "2px outset"
    },
    "control-bar button": {
        "marginTop": 4,
        "marginRight": 4,
        "marginBottom": 4,
        "marginLeft": 4,
        "width": 30,
        "height": 30,
        "backgroundSize": "22px 22px",
        "backgroundPosition": "center",
        "backgroundRepeat": "no-repeat"
    },
    "-reload-": {
        "backgroundImage": "url(../images/refresh.svg)"
    },
    "-stop-": {
        "backgroundImage": "url(../images/stop-button.svg)"
    },
    "-back-": {
        "backgroundImage": "url(../images/left.svg)"
    },
    "-forward-": {
        "backgroundImage": "url(../images/right.svg  )"
    },
    "application": {
        "display": "flex",
        "flexDirection": "column"
    },
    "application webview": {}
});