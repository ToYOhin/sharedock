import QRCodeGenerator from "qrcode";
import { useEffect, useState } from "react";
import CenterLoader from "../core/CenterLoader";

const qrCodeSize = 400;

const qrCodeWrapperStyle = {
  display: "flex",
  justifyContent: "center",
  width: "100%",
};

const qrCodeFrameStyle = {
  width: "100%",
  maxWidth: qrCodeSize,
  aspectRatio: "1 / 1",
};

const QRCode = ({ link }: { link: string }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>();

  useEffect(() => {
    setQrCodeUrl(undefined);

    QRCodeGenerator.toDataURL(link, { margin: 2, width: 400 })
      .then(setQrCodeUrl)
      .catch((_) => {
        // Ignore errors
      });
  }, [link]);

  if (!qrCodeUrl) {
    return (
      <div style={qrCodeWrapperStyle}>
        <div
          style={{
            ...qrCodeFrameStyle,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CenterLoader />
        </div>
      </div>
    );
  }

  return (
    <div style={qrCodeWrapperStyle}>
      <img
        alt="qrcode"
        src={qrCodeUrl}
        style={{ ...qrCodeFrameStyle, display: "block", height: "auto" }}
      />
    </div>
  );
};

export default QRCode;
