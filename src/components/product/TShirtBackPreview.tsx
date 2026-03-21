import tshirtBack from "@/assets/tshirt-back-blank.jpg";

interface TShirtBackPreviewProps {
  story?: string;
  productName?: string;
}

export default function TShirtBackPreview({ story, productName = "SECOND CHANCE" }: TShirtBackPreviewProps) {
  return (
    <div className="aspect-square bg-black overflow-hidden relative" style={{ backgroundColor: "#000000" }}>
      <img src={tshirtBack} alt="T-shirt back view" className="w-full h-full object-cover" />

      {/* Text overlay positioned on the back of the shirt */}
      {story && (
        <div className="absolute inset-0 flex items-start justify-center pointer-events-none pt-[15%]">
          <div className="text-center px-[20%] max-h-[45%] overflow-hidden flex flex-col items-center justify-start">
            <h2
              className="font-display text-base md:text-lg lg:text-xl mb-2 tracking-wide"
              style={{ color: "#bf333b" }}
            >
              {productName}
            </h2>
            <div className="w-12 h-px mb-2" style={{ backgroundColor: "#bf333b" }} />
            <p
              className="font-body text-[8px] md:text-[10px] lg:text-xs leading-relaxed whitespace-pre-wrap text-center"
              style={{ color: "#bf333b" }}
            >
              {story}
            </p>
          </div>
        </div>
      )}

      {!story && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center bg-background/60 backdrop-blur-sm px-4 py-2 rounded">
            <p className="text-muted-foreground font-body text-xs">Back View</p>
          </div>
        </div>
      )}
    </div>
  );
}
