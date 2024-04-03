import { getArea, getLength } from "ol/sphere";
import { Fill, Stroke, Style, Circle as CircleStyle } from "ol/style";

export const drawStyle = () => {
  return new Style({
    fill: new Fill({ color: "rgba(255, 255, 255, 0.2)" }),
    stroke: new Stroke({
      color: "rgba(0, 0, 0, 0.5)",
      lineDash: [10, 10],
      width: 2,
    }),
    image: new CircleStyle({
      radius: 5,
      stroke: new Stroke({ color: "rgba(0, 0, 0, 0.7)" }),
      fill: new Fill({ color: "rgba(255, 255, 255, 0.2)" }),
    }),
  });
};

export const formatLength = function (line) {
  const length = getLength(line);
  return length > 1000
    ?  Intl.NumberFormat('vi-VN').format(Math.round((length / 1000) * 100) / 100) + " " + "km"
    : Intl.NumberFormat('vi-VN').format(Math.round(length * 100) / 100) + " " + "m";
};

export const formatArea = function (polygon) {
  const area = getArea(polygon);
  return area > 1000000
    ? Intl.NumberFormat('vi-VN').format(Math.round((area / 1000000) * 100) / 100) + " " + "km<sup>2</sup>"
    : Intl.NumberFormat('vi-VN').format(Math.round(area * 100) / 100) + " " + "m<sup>2</sup>";
};
