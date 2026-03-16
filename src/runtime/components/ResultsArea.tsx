import React from "react";

interface ResultsAreaProps {
  loading: boolean;
  error: string | null;
  loadingImageSrc: string;
}

const ResultsArea: React.FC<ResultsAreaProps> = ({
  loading,
  error,
  loadingImageSrc,
}) => {
  return (
    <>
      {loading && (
        <div style={{ textAlign: "center", margin: "8px 0" }}>
          <img src={loadingImageSrc} alt="Loading" />
        </div>
      )}
      {error && <p>{error}</p>}

      <div id="resultsDiv"></div>
    </>
  );
};

export default ResultsArea;
