/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

// TODO Write the condenseColumns function so that it takes the indexes instead of the color.
// Pass "data" around instead of constantly referring to "state" this makes it so that we don't have to
// set state as ofter

import React, { Component } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  View,
  Dimensions,
  Animated,
  PanResponder,
  Image,
  TouchableHighlight,
  ImageBackground
} from "react-native";

import GestureRecognizer, {
  swipeDirections
} from "react-native-swipe-gestures";

// Tile Component - rendered on SwappableGrid
import Tile from "./Tile";

// Use Platform.select to define behaviors for differnt platforms.
const instructions = Platform.select({
  ios: "Press Cmd+R to reload,\n" + "Cmd+D or shake for dev menu",
  android:
    "Double tap R on your keyboard to reload,\n" +
    "Shake or press menu button for dev menu"
});

import imageType from "../components/ImageTypes";

import { getJamJarFromBean, isJam } from "../components/JamFunctions";

let firstLoad = true;

let boardWidth = 5;
let boardHeight = 5;

let speed = 300;

class TileData {
  constructor(img, index, key) {
    this.index = index;
    this.fadeAnimation = new Animated.Value(1);
    this.key = key;
    this.location = new Animated.ValueXY();
    this.imageType = img;
    this.rotation = new Animated.Value(0);
    this.scale = new Animated.Value(1);
    this.view = <Image source={img} style={styles.tile} />;
  }

  setView(imageType) {
    this.imageType = imageType;
    this.view = <Image source={imageType} style={styles.tile} />;
  }
}

const animationType = {
  SWAP: 0,
  FALL: 1
};

const rowOrCol = {
  ROW: 0,
  COLUMN: 1
};

var cancelTouches = false;

export default class Swappables extends Component<{}> {
  constructor(props) {
    super(props);

    // Inititalize to swipe up, will change later.
    this.swipeDirection = swipeDirections.SWIPE_UP;
    this.speed = 100;
    this.animationState = animationType.SWAP;
    this.currentDirection = rowOrCol.ROW;
    this.otherDirection = rowOrCol.COLUMN;

    this.state = {
      origin: [0, 0],
      width: 0,
      height: 0,
      tileComponents: [[]],
      tileDataSource: [[new TileData()]],
      topMargin: this.props.topMargin,
      JamJarLocation: new Animated.ValueXY(),
      JamJarComponent: <View />,
      JamJarScaleX: new Animated.Value(1),
      JamJarScaleY: new Animated.Value(1),
      JamJar: imageType.REDJAM
    };
  }

  getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
  }

  onSwipe(gestureName, gestureState) {
    //cancelTouches = true

    let initialGestureX = gestureState.x0;
    let initialGestureY = gestureState.y0;

    // Need to get convert location of swipe to an index.

    let i = Math.round(
      (initialGestureX - this.state.origin[0] - 0.5 * TILE_WIDTH) / TILE_WIDTH
    );
    let j = Math.round(
      (initialGestureY -
        this.state.topMargin -
        this.state.origin[1] -
        0.5 * TILE_WIDTH) /
        TILE_WIDTH
    );

    const { SWIPE_UP, SWIPE_DOWN, SWIPE_LEFT, SWIPE_RIGHT } = swipeDirections;
    this.setState({ gestureName: gestureName });

    //  TODO: Make sure that the boundary conditions 0 and 4 aren't HARDCODED
    switch (gestureName) {
      case SWIPE_UP:
        console.log("An upward swipe has been registered");

        if (j > 0) {
          this.swipeDirection = SWIPE_UP;
          this.updateGrid(i, j, 0, -1);
        }

        break;
      case SWIPE_DOWN:
        console.log("A downward swipe has been registered");

        if (j < 4) {
          this.swipeDirection = SWIPE_DOWN;
          this.updateGrid(i, j, 0, 1);
        }

        break;
      case SWIPE_LEFT:
        console.log("A left swipe has been registered");

        if (i > 0) {
          this.swipeDirection = SWIPE_LEFT;
          this.updateGrid(i, j, -1, 0);
        }

        break;
      case SWIPE_RIGHT:
        console.log("A right swipe has been registered");

        if (i < 4) {
          this.swipeDirection = SWIPE_RIGHT;
          this.updateGrid(i, j, 1, 0);
        }
        break;
    }
  }

  // data - the array of
  pushTileDataToComponent(tileData) {
    console.log("Pushing Tile Data");

    var a = [];
    // This creates the array of Tile components that is stored as a state variable.
    tileData.map((row, i) => {
      let rows = row.map((e, j) => {
        a.push(
          <Tile
            location={e.location}
            scale={e.scale}
            key={e.key}
            rotation={e.rotation}
            subview={e.view}
          />
        );
      });
      // This is where the error occurs where an element no longer receives touches.
      // Don't wrap this in a view.
      return;
      rows;
    });

    this.setState({
      tileComponents: a
    });
  }

  // takes the indexes that will be animated and
  animateBeanMatch(indexesToAnimate, location) {
    let locationToAnimateTo = [
      location[0] * TILE_WIDTH,
      location[1] * TILE_WIDTH
    ];

    let len = indexesToAnimate.length;

    for (var n = 0; n < len; n++) {
      let e = indexesToAnimate[n];

      let i = e[0];
      let j = e[1];

      Animated.sequence([
        Animated.delay(400),
        Animated.timing(this.state.tileDataSource[i][j].scale, {
          toValue: 1.1,
          duration: 200
        }),
        Animated.timing(this.state.tileDataSource[i][j].scale, {
          toValue: 1,
          duration: 200
        }),
        Animated.timing(this.state.tileDataSource[i][j].location, {
          toValue: { x: locationToAnimateTo[0], y: locationToAnimateTo[1] },
          duration: this.speed
        })
      ]).start(() => {});
    }
  }

  containsIndexPair(arr, pair) {
    let a = arr.filter(e => e[0] == pair[0] && e[1] == pair[1]);
    return a.length !== 0;
  }

  // Handles swipe events
  updateGrid(i, j, dx, dy) {
    if (dx == 0) {
      this.currentDirection = rowOrCol.COLUMN;
      this.otherDirection = rowOrCol.ROW;
    } else if (dy == 0) {
      this.currentDirection = rowOrCol.ROW;
      this.otherDirection = rowOrCol.COLUMN;
    }

    let swipeBeganAt = [i, j];
    let swipeDirectedAt = [i + dx, j + dy];

    const newData = this.state.tileDataSource;

    const swapStarter = this.state.tileDataSource[i][j];
    const swapEnder = this.state.tileDataSource[i + dx][j + dy];

    const firstJamToJam = this.state.tileDataSource[i][j].imageType;
    const secondJamToJam = this.state.tileDataSource[i + dx][j + dy].imageType;

    // Perform the swap
    newData[i][j] = swapEnder;
    newData[i + dx][j + dy] = swapStarter;
  }

  componentDidUpdate() {
    // Beform the animation every time component updates.
    switch (this.animationState) {
      case animationType.SWAP:
        this.animateValuesToLocationsSwapStyle();
        break;
      case animationType.FALL:
        this.animateValuesToLocationsWaterfalStyle();
        break;
    }
  }

  componentWillMount() {
    // Grid that contains the keys that will be assigned to each tile via map
    let keys = [
      [0, 1, 2, 3, 4],
      [5, 6, 7, 8, 9],
      [10, 11, 12, 13, 14],
      [15, 16, 17, 18, 19],
      [20, 21, 22, 23, 24]
    ];

    var tileData = keys.map((row, i) => {
      let dataRows = row.map((key, j) => {
        let beans = [
          imageType.BLUEJELLYBEAN,
          imageType.PINKJELLYBEAN,
          imageType.PURPLEJELLYBEAN,
          imageType.YELLOWJELLYBEAN,
          imageType.ORANGEJELLYBEAN,
          imageType.GREENJELLYBEAN,
          imageType.REDJELLYBEAN,
          imageType.REDJAM,
          imageType.BLUEJAM,
          imageType.ORANGEJAM,
          imageType.PURPLEJAM,
          imageType.GREENJAM,
          imageType.PINKJAM,
          imageType.PURPLEJAM,
          imageType.YELLOWJAM
        ];

        let randIndex = this.getRandomInt(7);

        let data = new TileData(beans[randIndex], [i, j], key);

        return data;
      });

      return dataRows;
    });

    this.setState({ tileDataSource: tileData });
  }

  onLayout(event) {
    console.log("onLayout event", event.nativeEvent);

    // This does not need to be a state variable
    this.setState({
      origin: [event.nativeEvent.layout.x, event.nativeEvent.layout.y]
    });
  }

  componentDidMount() {
    var a = [];
    // This creates the array of Tile components that is stored as a state variable
    this.state.tileDataSource.map((row, i) => {
      let rows = row.map((e, j) => {
        a.push(
          <Tile
            update={this.updateGrid.bind(this)}
            location={e.location}
            scale={e.scale}
            key={e.key}
            subview={e.view}
          />
        );
      });
      // This is where the error occurs where an element no longer receives touches.
      // Don't wrap this in a view.
      return;
      rows;
    });

    this.setState({ tileComponents: a });
  }

  isMatch(itemOne, itemTwo) {
    if (itemOne.imageType == itemTwo.imageType) {
      return true;
    } else if (isJam(itemOne.imageType) && isJam(itemTwo.imageType)) {
      return true;
    }
  }

  checkRowColForMatch(coordinate, direction) {
    let consecutives = [];

    for (i = 0; i < 4; i++) {
      // If its a column,check the next item in the column
      // Inistialize these to zero and then decide which one will be iterated and which will be held consant.
      let x = 0;
      let y = 0;

      // Used to whether the next itme should be on the left or on the right.
      let dx = 0;
      let dy = 0;

      if (direction == rowOrCol.COLUMN) {
        x = coordinate[0];
        y = i;
        dy = 1;
      } else if (direction == rowOrCol.ROW) {
        x = i;
        dx = 1;
        y = coordinate[1];
      }

      let firstItem = this.state.tileDataSource[x][y];
      let nextItem = this.state.tileDataSource[x + dx][y + dy];

      if (this.isMatch(firstItem, nextItem)) {
        console.log("found a pair!", x, y);
        consecutives.push([x, y]);
        console.log("Consecutive indexes", consecutives);

        // Check if I've reached the end of the loop.
        if (i == 3) {
          consecutives.push([x + dx, y + dy]);
        }
      } else {
        // Push the last item in the sequence of matches
        consecutives.push([x, y]);
        if (consecutives.length >= 3) {
          console.log("returning consecutives");
          return consecutives;
        } else {
          // Reset
          consecutives = [];
        }
      }
    }

    if (consecutives.length >= 3) {
      return consecutives;
    } else {
      return [];
    }
  }

  // Gets all indexes with a specific color.
  getIndexesWithColor(color) {
    let colorIndexes = new Array();

    let x = this.state.tileDataSource.map((row, i) => {
      let colorRow = row.map((e, j) => {
        if (e.imageType == color) {
          colorIndexes.push([i, j]);
        } else if (isJam(e.imageType) && isJam(color)) {
          colorIndexes.push([i, j]);
        }
      });
    });
    return colorIndexes;
  }

  // Animates the values in the tile data source based on their index in the array.
  animateValuesToLocationsSwapStyle() {
    this.state.tileDataSource.map((row, i) => {
      row.map((elem, j) => {
        Animated.timing(
          //Step 1
          elem.location, //Step 2
          {
            toValue: { x: TILE_WIDTH * i, y: TILE_WIDTH * j },
            duration: this.speed
          } //Step 3
        ).start();
        //Animated.timing(elem.scale,{toValue: 1,duration: 1000}).start()
      });
    });
  }

  // Animates the values in the tile data source based on their index in the array.
  animateValuesToLocationsWaterfalStyle() {
    this.state.tileDataSource.map((row, i) => {
      row.map((elem, j) => {
        Animated.spring(
          //Step 1
          elem.location, //Step 2
          { toValue: { x: TILE_WIDTH * i, y: TILE_WIDTH * j }, friction: 4 } //Step 3
        ).start();
        //Animated.timing(elem.scale,{toValue: 1,duration: 1000}).start()
      });
    });
  }

  recolorMatches(data, neighbors) {
    let x = data.map((row, i) => {
      let y = row.map((e, j) => {
        const beans = [
          imageType.BLUEJELLYBEAN,
          imageType.PINKJELLYBEAN,
          imageType.PURPLEJELLYBEAN,
          imageType.YELLOWJELLYBEAN,
          imageType.ORANGEJELLYBEAN,
          imageType.GREENJELLYBEAN,
          imageType.REDJELLYBEAN,
          imageType.REDJAM,
          imageType.BLUEJAM,
          imageType.ORANGEJAM,
          imageType.PURPLEJAM,
          imageType.GREENJAM,
          imageType.PINKJAM,
          imageType.PURPLEJAM,
          imageType.YELLOWJAM
        ];

        let randIndex = this.getRandomInt(7);

        let n = neighbors.filter(e => {
          return i == e[0] && j == e[1];
        });

        if (n.length != 0) {
          e.setView(beans[randIndex]);
          return e;
        } else {
          return e;
        }
      });

      return y;
    });

    return x;
  }

  render() {
    const config = {
      velocityThreshold: 0.3,
      directionalOffsetThreshold: 80
    };

    // Only swipe if cancelTouches is false.
    let swipeOrNot = cancelTouches
      ? (direction, state) => {
          return;
        }
      : (direction, state) => this.onSwipe(direction, state);

    return (
      <View style={styles.container} onLayout={this.onLayout.bind(this)}>
        <View>
          <GestureRecognizer
            config={config}
            style={styles.gestureContainer}
            onSwipe={(direction, state) => swipeOrNot(direction, state)}
          >
            {this.state.tileComponents}
          </GestureRecognizer>
        </View>
      </View>
    );
  }
}

let Window = Dimensions.get("window");
let windowSpan = Math.min(Window.width, Window.height);
let TILE_WIDTH = windowSpan / 6;

let windowWidth = Window.width;
let windowHeight = Window.height;

let blue = "#4286f4";
let red = "#f24646";
let yellow = "#faff7f";
let green = "#31a51a";
let orange = "#ff7644";
let pink = "#ff51f3";

let styles = StyleSheet.create({
  backGroundImage: {
    flex: 1,
    width: 300,
    height: 300
  },
  gridContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center"
  },
  mainView: {
    flex: 1,
    alignItems: "center"
  },
  button: {
    width: 200,
    height: 50,
    backgroundColor: red
  },
  gestureContainer: {
    flex: 1
  },
  container: {
    width: TILE_WIDTH * 5,
    height: TILE_WIDTH * 5
    //backgroundColor: red,
  },
  tile: {
    width: TILE_WIDTH,
    height: TILE_WIDTH
  }
});
