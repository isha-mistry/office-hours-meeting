import { JSX } from "react/jsx-runtime";

export interface ISvgIcons {
  [key: string]: JSX.Element;
}

export interface INestedSvgIcons {
  [key: string]: {
    [key: string]: JSX.Element;
  };
}
