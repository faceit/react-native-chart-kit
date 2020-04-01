import React from "react";
import { View, ScrollView, StyleSheet, Animated, Text, TextInput } from "react-native";
import {
  Svg,
  Circle,
  Polygon,
  Polyline,
  Path,
  Rect,
  G
} from "react-native-svg";
import AbstractChart from "../abstract-chart";
import { LegendItem } from "./legend-item";

let AnimatedCircle = Animated.createAnimatedComponent(Circle);

class LineChart extends AbstractChart {

  label = React.createRef();

  state = {
    x: new Animated.Value(0),
  };

  getColor = (dataset, opacity) => {
    return (dataset.color || this.props.chartConfig.color)(opacity);
  };

  getStrokeWidth = dataset => {
    return dataset.strokeWidth || this.props.chartConfig.strokeWidth || 3;
  };

  getDatas = data =>
    data.reduce((acc, item) => (item.data ? [...acc, ...item.data] : acc), []);

  getPropsForDots = (x, i) => {
    const { getDotProps, chartConfig = {} } = this.props;
    if (typeof getDotProps === "function") {
      return getDotProps(x, i);
    }
    const { propsForDots = {} } = chartConfig;
    return { r: "4", ...propsForDots };
  };
  renderDots = config => {
    const {
      data,
      width,
      height,
      paddingTop,
      paddingRight,
      onDataPointClick
    } = config;
    const output = [];
    const datas = this.getDatas(data);
    const baseHeight = this.calcBaseHeight(datas, height);
    const {
      getDotColor,
      hidePointsAtIndex = [],
      renderDotContent = () => {
        return null;
      }
    } = this.props;

    data.forEach(dataset => {
      if (dataset.withDots == false) return;

      dataset.data.forEach((x, i) => {
        if (hidePointsAtIndex.includes(i)) {
          return;
        }
        const cx =
          paddingRight + (i * (width - paddingRight)) / dataset.data.length;
        const cy =
          ((baseHeight - this.calcHeight(x, datas, height)) / 4) * 3 +
          paddingTop;
        const onPress = () => {
          if (!onDataPointClick || hidePointsAtIndex.includes(i)) {
            return;
          }

          onDataPointClick({
            index: i,
            value: x,
            dataset,
            x: cx,
            y: cy,
            getColor: opacity => this.getColor(dataset, opacity)
          });
        };
        output.push(
          <Circle
            key={Math.random()}
            cx={cx}
            cy={cy}
            fill={
              typeof getDotColor === "function"
                ? getDotColor(x, i)
                : this.getColor(dataset, 0.9)
            }
            onPress={onPress}
            {...this.getPropsForDots(x, i)}
          />,
          <Circle
            key={Math.random()}
            cx={cx}
            cy={cy}
            r="14"
            fill="#fff"
            fillOpacity={0}
            onPress={onPress}
          />,
          renderDotContent({ x: cx, y: cy, index: i })
        );
      });
    });
    return output;
  };

  linearInterpolate = function(prev, next, point) {
    return prev + (next - prev) * point;
  };

  getNumUndefinedUntilNextVal = function(arr, index) {
    let numUndefined = 0;
    for (let i = index; i < arr.length; i++) {
      if (typeof arr[i] === 'undefined') {
        numUndefined++;
      } else {
        break;
      }
    }
    return numUndefined;
  };


  prepareValueToShow = (value,rounded) => {
    if (rounded){
      return Math.floor(value)
    }else{
      return value.toFixed(1)
    }
  }


  renderScrollableDot = config => {
    const {
      data,
      width,
      height,
      paddingTop,
      paddingRight,
      x,
      scrollableDotFill,
      scrollableDotStrokeColor,
      scrollableDotStrokeWidth,
      scrollableDotRadius,
      scrollableInfoViewStyle,
      scrollableInfoTextStyle,
      scrollableInfoSize,
      scrollableInfoOffset,
      roundCurrentValue
    } = config;
    const output = [];
    const datas = this.getDatas(data).filter(e => e != undefined);
    const baseHeight = this.calcBaseHeight(datas, height);




    data.forEach(dataset => {
      if (dataset.withScrollableDot == false) return;

      const data = dataset.data
      const normalizedData = dataset.data.filter(e => e != undefined)

      const perData = width / data.length
      let values = []
      let yValues = []
      let xValues = []

      let yValuesLabel = []
      let xValuesLabel = []

      for (let index = data.length; index >= 0; index--) {
        if (data[index] != undefined) {
          values.push((data.length - 1 - index) * perData)

          const yval = ((baseHeight - this.calcHeight(data[index], normalizedData, height)) / 4) * 3 + paddingTop;
          yValues.push(yval)
          const xval = (paddingRight + ((index) * (width - paddingRight)) / data.length)
          xValues.push(xval)

          yValuesLabel.push(yval - (scrollableInfoSize.height + scrollableInfoOffset))
          xValuesLabel.push(xval - (scrollableInfoSize.width / 2))
        }
      }

      if (values.length > 0) {
        if (values.length == 1) {
          output.push(
            [
              <View key={Math.random()} style={[scrollableInfoViewStyle, { transform: [{ translateX: xValuesLabel[0] }, { translateY: yValuesLabel[0] }], width: scrollableInfoSize.width, height: scrollableInfoSize.height }]}>
                <TextInput onLayout={() => {
                  this.label.current.setNativeProps({ text: `${this.prepareValueToShow(normalizedData[normalizedData.length - 1], roundCurrentValue)}` });
                }} style={scrollableInfoTextStyle} ref={this.label} />
              </View>,
              <Circle
                key={Math.random()}
                cx={xValues[0]}
                cy={yValues[0]}
                r={scrollableDotRadius}
                stroke={scrollableDotStrokeColor}
                strokeWidth={scrollableDotStrokeWidth}
                fill={scrollableDotFill}
              />
            ])
        } else {

          let lastIndex;


          let interpolatedArr = [];

          let firstvalueI
          let lastvalueI

          const undefinedArr = data.filter(e => e == undefined)
          
          if (undefinedArr.length != 0){
            for (let i = 0; i < data.length; i++) {
              if (!data[i]) {
                const numUndefined = this.getNumUndefinedUntilNextVal(data, i);
                const pointMultiplier = 1 / (numUndefined + 1);
                let skip = 0;
                for (let k = 0; k < numUndefined; k++) {
                  interpolatedArr[i + k] = this.linearInterpolate(
                    data[i - 1],
                    data[i + numUndefined],
                    (k + 1) * pointMultiplier
                  );
                  skip = k;
                }
                i += skip;
              } else {
                if (firstvalueI == undefined){
                  firstvalueI = i
                }
                interpolatedArr[i] = data[i];
                lastvalueI = i
              }
            }
          }else{
            interpolatedArr = data
          }
          

          x.addListener(value => {
            const index = value.value / perData;
            if (!lastIndex) {
              lastIndex = index;
            }
      
            let abs = Math.floor(index);
            let percent = index - abs;
            abs = interpolatedArr.length - abs - 1;
            // console.log(index);
            
            if (interpolatedArr.length - 1 - index < firstvalueI) {
              this.label.current.setNativeProps({
                text: `${this.prepareValueToShow(normalizedData[0], roundCurrentValue)}`
              });
            } else {
              if ((interpolatedArr.length - 1 - index) > lastvalueI){
                this.label.current.setNativeProps({
                  text: `${this.prepareValueToShow(data[lastvalueI], roundCurrentValue)}`
                });
              }else{
                if (index > lastIndex) {
                  // to right
        
                  const base = interpolatedArr[abs];
                  const prev = interpolatedArr[abs - 1];
                  
                  if (prev > base) {
                    let rest = prev - base;
                    this.label.current.setNativeProps({
                      text: `${this.prepareValueToShow(base + percent * rest, roundCurrentValue)}`
                    });
                  } else {
                    let rest = base - prev;
                    this.label.current.setNativeProps({
                      text: `${this.prepareValueToShow(base - percent * rest, roundCurrentValue)}`
                    });
                  }
                } else {
                  // to left
        
                  const base = interpolatedArr[abs - 1];
                  const next = interpolatedArr[abs];
                  percent = 1 - percent;
                  if (next > base) {
                    let rest = next - base;
                    this.label.current.setNativeProps({
                      text: `${this.prepareValueToShow(base + percent * rest, roundCurrentValue)}`
                    });
                  } else {
                    let rest = base - next;
                    this.label.current.setNativeProps({
                      text: `${this.prepareValueToShow(base - percent * rest, roundCurrentValue)}`
                    });
                  }
                }
              }
              }
              
            lastIndex = index;
          });


          const translateX = x.interpolate({
            inputRange: values,
            outputRange: xValues,
            extrapolate: 'clamp',
          });


          const translateY = x.interpolate({
            inputRange: values,
            outputRange: yValues,
            extrapolate: 'clamp',
          });

          const labelTranslateX = x.interpolate({
            inputRange: values,
            outputRange: xValuesLabel,
            extrapolate: 'clamp',
          });


          const labelTranslateY = x.interpolate({
            inputRange: values,
            outputRange: yValuesLabel,
            extrapolate: 'clamp',
          });


          output.push(
            [
              <Animated.View key={Math.random()} style={[scrollableInfoViewStyle, { transform: [{ translateX: labelTranslateX }, { translateY: labelTranslateY }], width: scrollableInfoSize.width, height: scrollableInfoSize.height }]}>
                <TextInput onLayout={() => {
                  this.label.current.setNativeProps({ text: `${this.prepareValueToShow(normalizedData[normalizedData.length - 1], roundCurrentValue)}` });
                }} style={scrollableInfoTextStyle} ref={this.label} />
              </Animated.View>,
              <AnimatedCircle
                key={Math.random()}
                cx={translateX}
                cy={translateY}
                r={scrollableDotRadius}
                stroke={scrollableDotStrokeColor}
                strokeWidth={scrollableDotStrokeWidth}
                fill={scrollableDotFill}
              />
            ]
          );
        }
      }




    });

    return output;
  };

  renderShadow = config => {
    if (this.props.bezier) {
      return this.renderBezierShadow(config);
    }

    const { data, width, height, paddingRight, paddingTop } = config;
    const datas = this.getDatas(data);
    const baseHeight = this.calcBaseHeight(datas, height);
    return config.data.map((dataset, index) => {
      return (
        <Polygon
          key={index}
          points={
            dataset.data
              .map((d, i) => {
                const x =
                  paddingRight +
                  (i * (width - paddingRight)) / dataset.data.length;
                const y =
                  ((baseHeight - this.calcHeight(d, datas, height)) / 4) * 3 +
                  paddingTop;
                return `${x},${y}`;
              })
              .join(" ") +
            ` ${paddingRight +
            ((width - paddingRight) / dataset.data.length) *
            (dataset.data.length - 1)},${(height / 4) * 3 +
            paddingTop} ${paddingRight},${(height / 4) * 3 + paddingTop}`
          }
          fill="url(#fillShadowGradient)"
          strokeWidth={0}
        />
      );
    });
  };

  renderLine = config => {
    if (this.props.bezier) {
      return this.renderBezierLine(config);
    }

    const { width, height, paddingRight, paddingTop, data, linejoinType } = config;
    const output = [];
    const datas = this.getDatas(data).filter(e => e != undefined)
    const baseHeight = this.calcBaseHeight(datas, height);

    data.forEach((dataset, index) => {
      let points = []
      dataset.data.forEach((d, i) => {

        if (d != undefined) {
          const x =
            (i * (width - paddingRight)) / dataset.data.length + paddingRight;
          const y =
            ((baseHeight - this.calcHeight(d, datas, height)) / 4) * 3 +
            paddingTop;
          points.push(`${x},${y}`)
        }
      })
      // const points = dataset.data.map((d, i) => {

      //   return `${x},${y}`;
      // });
      // console.log(points);

      output.push(
        <Polyline
          key={index}
          strokeLinejoin={linejoinType}
          points={points.join(" ")}
          fill="none"
          stroke={this.getColor(dataset, 0.2)}
          strokeWidth={this.getStrokeWidth(dataset)}
        />
      );
    });

    return output;
  };

  getBezierLinePoints = (dataset, config) => {
    const { width, height, paddingRight, paddingTop, data } = config;
    if (dataset.data.length === 0) {
      return "M0,0";
    }

    const datas = this.getDatas(data);
    const x = i =>
      Math.floor(
        paddingRight + (i * (width - paddingRight)) / dataset.data.length
      );
    const baseHeight = this.calcBaseHeight(datas, height);
    const y = i => {
      const yHeight = this.calcHeight(dataset.data[i], datas, height);
      return Math.floor(((baseHeight - yHeight) / 4) * 3 + paddingTop);
    };

    return [`M${x(0)},${y(0)}`]
      .concat(
        dataset.data.slice(0, -1).map((_, i) => {
          const x_mid = (x(i) + x(i + 1)) / 2;
          const y_mid = (y(i) + y(i + 1)) / 2;
          const cp_x1 = (x_mid + x(i)) / 2;
          const cp_x2 = (x_mid + x(i + 1)) / 2;
          return (
            `Q ${cp_x1}, ${y(i)}, ${x_mid}, ${y_mid}` +
            ` Q ${cp_x2}, ${y(i + 1)}, ${x(i + 1)}, ${y(i + 1)}`
          );
        })
      )
      .join(" ");
  };

  renderBezierLine = config => {
    return config.data.map((dataset, index) => {
      const result = this.getBezierLinePoints(dataset, config);
      return (
        <Path
          key={index}
          d={result}
          fill="none"
          stroke={this.getColor(dataset, 0.2)}
          strokeWidth={this.getStrokeWidth(dataset)}
        />
      );
    });
  };

  renderBezierShadow = config => {
    const { width, height, paddingRight, paddingTop, data } = config;
    return data.map((dataset, index) => {
      const d =
        this.getBezierLinePoints(dataset, config) +
        ` L${paddingRight +
        ((width - paddingRight) / dataset.data.length) *
        (dataset.data.length - 1)},${(height / 4) * 3 +
        paddingTop} L${paddingRight},${(height / 4) * 3 + paddingTop} Z`;
      return (
        <Path
          key={index}
          d={d}
          fill="url(#fillShadowGradient)"
          strokeWidth={0}
        />
      );
    });
  };

  renderLegend = (width, legendOffset) => {
    const { legend, datasets } = this.props.data;
    const baseLegendItemX = width / (legend.length + 1);

    return legend.map((legendItem, i) => (
      <G key={Math.random()}>
        <LegendItem
          index={i}
          iconColor={this.getColor(datasets[i], 0.9)}
          baseLegendItemX={baseLegendItemX}
          legendText={legendItem}
          labelProps={{ ...this.getPropsForLabels() }}
          legendOffset={legendOffset}
        />
      </G>
    ));
  };

  render() {
    const {
      width,
      height,
      data,
      withScrollableDot = false,
      withShadow = true,
      withDots = true,
      withInnerLines = true,
      withOuterLines = true,
      withHorizontalLabels = true,
      withVerticalLabels = true,
      style = {},
      decorator,
      onDataPointClick,
      verticalLabelRotation = 0,
      horizontalLabelRotation = 0,
      formatYLabel = yLabel => yLabel,
      formatXLabel = xLabel => xLabel,
      segments
    } = this.props;
    const { x } = this.state;
    const { labels = [] } = data;
    const {
      borderRadius = 0,
      paddingTop = 16,
      paddingRight = 64,
      margin = 0,
      marginRight = 0,
      paddingBottom = 0
    } = style;

    const config = {
      width,
      height,
      verticalLabelRotation,
      horizontalLabelRotation
    };

    const datas = this.getDatas(data.datasets);

    let count = Math.min(...datas) === Math.max(...datas) ? 1 : 4;
    if (segments) {
      count = segments;
    }

    const legendOffset = this.props.data.legend ? height * 0.15 : 0;

    return (
      <View style={style}>
        <Svg
          height={height + paddingBottom + legendOffset}
          width={width - margin * 2 - marginRight}
        >
          <Rect
            width="100%"
            height={height + legendOffset}
            rx={borderRadius}
            ry={borderRadius}
            fill="url(#backgroundGradient)"
          />
          {this.props.data.legend &&
            this.renderLegend(config.width, legendOffset)}
          <G x="0" y={legendOffset}>
            {this.renderDefs({
              ...config,
              ...this.props.chartConfig
            })}
            <G>
              {withInnerLines
                ? this.renderHorizontalLines({
                  ...config,
                  count: count,
                  paddingTop,
                  paddingRight
                })
                : withOuterLines
                  ? this.renderHorizontalLine({
                    ...config,
                    paddingTop,
                    paddingRight
                  })
                  : null}
            </G>
            <G>
              {withHorizontalLabels
                ? this.renderHorizontalLabels({
                  ...config,
                  count: count,
                  data: datas.filter(e => e != undefined),
                  paddingTop,
                  paddingRight,
                  formatYLabel,
                  decimalPlaces: this.props.chartConfig.decimalPlaces
                })
                : null}
            </G>
            <G>
              {withInnerLines
                ? this.renderVerticalLines({
                  ...config,
                  data: data.datasets[0].data,
                  paddingTop,
                  paddingRight
                })
                : withOuterLines
                  ? this.renderVerticalLine({
                    ...config,
                    paddingTop,
                    paddingRight
                  })
                  : null}
            </G>
            <G>
              {withVerticalLabels
                ? this.renderVerticalLabels({
                  ...config,
                  labels,
                  paddingRight,
                  paddingTop,
                  formatXLabel
                })
                : null}
            </G>
            <G>
              {this.renderLine({
                ...config,
                ...this.props.chartConfig,
                paddingRight,
                paddingTop,
                data: data.datasets
              })}
            </G>
            <G>
              {withShadow &&
                this.renderShadow({
                  ...config,
                  data: data.datasets,
                  paddingRight,
                  paddingTop
                })}
            </G>
            <G>
              {withDots &&
                this.renderDots({
                  ...config,
                  data: data.datasets,
                  paddingTop,
                  paddingRight,
                  onDataPointClick
                })}
            </G>
            <G>
              {withScrollableDot &&
                this.renderScrollableDot({
                  ...config,
                  ...this.props.chartConfig,
                  data: data.datasets,
                  paddingTop,
                  paddingRight,
                  onDataPointClick,
                  x
                })}
            </G>
            <G>
              {decorator &&
                decorator({
                  ...config,
                  data: data.datasets,
                  paddingTop,
                  paddingRight
                })}
            </G>
          </G>
        </Svg>
        {
          withScrollableDot &&
          <ScrollView
            style={StyleSheet.absoluteFill}
            contentContainerStyle={{ width: width * 2 }}
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={Animated.event(
              [
                {
                  nativeEvent: {
                    contentOffset: { x: x },
                  },
                },
              ]
            )}
            horizontal
            bounces={false}
          />
        }
      </View>
    );
  }
}

export default LineChart;
