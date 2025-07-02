import React, { useRef, useContext } from "react";
import { useExitListener } from "../utils";
import { UIContext } from "../utils";

export default function Popup({ message, buttons }) {
  const popupRef = useRef(null);
  const { setShowPopup } = useContext(UIContext);
  useExitListener(setShowPopup, popupRef);

  const all_buttons = buttons.map((button) => {
    return (
      <button className="popup-button" onClick={button.action}>
        {button.label}
      </button>
    );
  });

  return (
    <div>
      <div className="blur"></div>
      <div ref={popupRef} className="popup-wrapper">
        <div className="popup">
          <h3 className="">{message}</h3>
        </div>
        <div className="popup-buttons-wrapper">{all_buttons}</div>
      </div>
    </div>
  );
}
