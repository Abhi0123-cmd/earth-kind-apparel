import tshirtBack from "@/assets/tshirt-back-blank.jpg";

interface TShirtBackPreviewProps {
  story?: string;
  productName?: string;
}

export default function TShirtBackPreview({ story, productName = "SECOND CHANCE" }: TShirtBackPreviewProps) {
  return (
    <div className="aspect-square bg-secondary overflow-hidden relative">
      <img src={tshirtBack} alt="T-shirt back view" className="w-full h-full object-cover" />

      {/* Text overlay positioned on the back of the shirt */}
      {story && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center px-[22%] pt-[8%] pb-[15%] max-h-[70%] overflow-hidden">
            <h2
              className="font-display text-sm md:text-base lg:text-lg mb-2 tracking-wide"
              style={{ color: "#bf333b" }}
            >
              {productName}
            </h2>
            <div className="w-10 h-px mx-auto mb-2" style={{ backgroundColor: "#bf333b" }} />
            <p
              className="font-body text-[7px] md:text-[9px] lg:text-[10px] leading-relaxed whitespace-pre-wrap"
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
            <p className="text-muted-foreground/60 font-body text-[10px] mt-0.5">Submit a story to see it here</p>
          </div>
        </div>
      )}
    </div>
  );
}
