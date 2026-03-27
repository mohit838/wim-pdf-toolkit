import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#08101D",
        }}
      >
        <div
          style={{
            position: "relative",
            width: 128,
            height: 128,
            borderRadius: 36,
            background: "#08101D",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              position: "absolute",
              width: 62,
              height: 78,
              borderRadius: 16,
              background: "#37D7C4",
              transform: "rotate(-8deg) translate(-16px, 6px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 78,
              height: 94,
              borderRadius: 18,
              background: "#FFF4D6",
              transform: "translate(10px, 2px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 18,
              height: 18,
              background: "#FFD26A",
              right: 21,
              top: 17,
              clipPath: "polygon(0 0, 100% 0, 100% 100%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 42,
              height: 6,
              borderRadius: 999,
              background: "#F97316",
              transform: "translate(7px, -6px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 30,
              height: 6,
              borderRadius: 999,
              background: "#1F6FEB",
              transform: "translate(1px, 10px)",
            }}
          />
        </div>
      </div>
    ),
    size,
  );
}
