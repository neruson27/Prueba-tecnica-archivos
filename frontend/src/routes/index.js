import React from "react";
import Home from "../home";
import FileDetail from "../fileDetail";

const ROUTES = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/:file",
    element: <FileDetail />,
  }
];

export default ROUTES;