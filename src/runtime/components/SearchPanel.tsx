import React from "react";

interface SearchPanelProps {
  addressInput: string;
  hasResults: boolean;
  onFormSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onAddressInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchClick: () => void;
  onClearClick: () => void;
}

const SearchPanel: React.FC<SearchPanelProps> = ({
  addressInput,
  hasResults,
  onFormSubmit,
  onAddressInputChange,
  onSearchClick,
  onClearClick,
}) => {
  return (
    <div style={{ marginLeft: "5px", marginRight: "5px" }}>
      <div style={{ width: "80%" }}>
        <span className="title-text">Voter District Finder</span>
      </div>
      <hr style={{ color: "gray" }} />

      <form onSubmit={onFormSubmit}>
        <div className="parent">
          <div className="child1">
            <input
              className="input-text"
              type="text"
              placeholder="141 Pryor st"
              value={addressInput}
              onChange={onAddressInputChange}
              aria-label="Enter address to search"
              title="Enter address to search"
            />
          </div>
          <div className="child2">
            <button
              className="toggle-icon"
              type="button"
              onClick={onSearchClick}
              aria-label="Search for address"
              title="Search for address"
            >
              Search
            </button>
          </div>
          {hasResults && (
            <div className="clearDiv">
              <button type="button" onClick={onClearClick} aria-label="Clear search results" title="Clear search results">
                Clear
              </button>
            </div>
          )}
        </div>
      </form>
      <hr style={{ color: "gray" }} />
    </div>
  );
};

export default SearchPanel;
