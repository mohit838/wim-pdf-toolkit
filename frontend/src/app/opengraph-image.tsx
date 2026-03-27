import { ImageResponse } from "next/og";
import { siteDescription, siteName, socialConfig } from "./site";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(135deg, #07101C 0%, #0C1630 60%, #102145 100%)",
          color: "#F8FAFC",
          fontFamily: "Arial, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 520,
            height: 520,
            borderRadius: "999px",
            background: "rgba(55, 215, 196, 0.18)",
            filter: "blur(70px)",
            top: -120,
            right: -80,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 420,
            height: 420,
            borderRadius: "999px",
            background: "rgba(249, 115, 22, 0.18)",
            filter: "blur(70px)",
            bottom: -120,
            left: -120,
          }}
        />
        <div
          style={{
            display: "flex",
            width: "100%",
            padding: "68px 74px",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 48,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 720 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 18,
                marginBottom: 26,
              }}
            >
              <div
                style={{
                  width: 86,
                  height: 86,
                  borderRadius: 24,
                  background: "#08101D",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 24px 60px rgba(0, 0, 0, 0.32)",
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 56,
                    borderRadius: 12,
                    background: "#FFF4D6",
                    position: "relative",
                    display: "flex",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      width: 34,
                      height: 42,
                      borderRadius: 10,
                      background: "#37D7C4",
                      transform: "rotate(-8deg) translate(-12px, 10px)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      width: 22,
                      height: 4,
                      borderRadius: 999,
                      background: "#F97316",
                      top: 18,
                      left: 12,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      width: 16,
                      height: 4,
                      borderRadius: 999,
                      background: "#1F6FEB",
                      top: 30,
                      left: 12,
                    }}
                  />
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 32,
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                }}
              >
                {siteName}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 72,
                fontWeight: 800,
                lineHeight: 1.02,
                letterSpacing: "-0.05em",
                marginBottom: 24,
              }}
            >
              {socialConfig.ogHeadline}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 28,
                lineHeight: 1.35,
                color: "#CBD5E1",
                maxWidth: 700,
              }}
            >
              {siteDescription}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              width: 270,
            }}
          >
            {socialConfig.ogFeatureLabels.map((label) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "18px 20px",
                  borderRadius: 22,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 999,
                    background: label === socialConfig.ogFeatureLabels.at(-1) ? "#37D7C4" : "#FF8B3D",
                  }}
                />
                <div style={{ display: "flex", fontSize: 26, fontWeight: 600 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
