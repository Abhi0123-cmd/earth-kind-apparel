interface TShirtBackPreviewProps {
  story?: string;
  productName?: string;
}

export default function TShirtBackPreview({ story, productName = "SECOND CHANCE" }: TShirtBackPreviewProps) {
  return (
    <div className="aspect-square bg-secondary flex items-center justify-center overflow-hidden relative">
      {/* T-shirt back silhouette */}
      <div className="w-full h-full bg-white flex flex-col items-center justify-center px-[15%] py-[12%]">
        {story ? (
          <div className="text-center max-h-full overflow-hidden">
            <h2
              className="font-display text-lg md:text-xl mb-3 tracking-wide"
              style={{ color: "#bf333b" }}
            >
              {productName}
            </h2>
            <div className="w-16 h-px mx-auto mb-3" style={{ backgroundColor: "#bf333b" }} />
            <p
              className="font-body text-[10px] md:text-xs leading-relaxed whitespace-pre-wrap"
              style={{ color: "#bf333b" }}
            >
              {story}
            </p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-muted-foreground font-body text-sm">Back View</p>
            <p className="text-muted-foreground/50 font-body text-xs mt-1">
              Submit a story to see it here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
