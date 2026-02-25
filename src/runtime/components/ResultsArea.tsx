import React from "react";
import Voterinfo from "../Voterinfo";

interface ResultsAreaProps {
  loading: boolean;
  error: string | null;
  loadingImageSrc: string;
  myparcelData: string;
  myyearData: number | null;
}

const ResultsArea: React.FC<ResultsAreaProps> = ({
  loading,
  error,
  loadingImageSrc,
  myparcelData,
  myyearData,
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

      <div id="moreResultsDiv">
        {myparcelData ? (
          <Voterinfo
            parcelID={myparcelData}
            myYear={myyearData}
            key={`${myparcelData}-${myyearData}`}
          />
        ) : (
          <div>No parcel data yet.</div>
        )}
      </div>
    </>
  );
};

export default ResultsArea;
