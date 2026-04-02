import { React, type AllWidgetProps, appActions, getAppStore, WidgetState } from "jimu-core";

import { JimuMapViewComponent, type JimuMapView } from "jimu-arcgis";
import request from "@arcgis/core/request";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import { loadModules } from "esri-loader";
// @ts-ignore static asset typing is provided at build time
import loadingAnimate from "./images/loading_animated.gif";
// @ts-ignore side-effect stylesheet import is resolved by widget bundler
import "./widgets.css";
import SearchPanel from "./components/SearchPanel";
import ResultsArea from "./components/ResultsArea";
import { suffixEntries } from "./constants/suffixEntries";

// ---------------------------------------------------------------------------
// Voterinfo component (consolidated from Voterinfo.tsx)
// ---------------------------------------------------------------------------
interface VoterinfoProps {
  parcelID: string;
}

const Voterinfo = ({ parcelID }: VoterinfoProps) => {
  const [historicData, setHistoricData] = React.useState<any>(null);
  const [profileData, setProfileData] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async (parcel: string) => {
    try {
      // Pull the latest available tax record for the parcel; no year input required.
      const queryUrl = `https://gismaps.fultoncountyga.gov/arcgispub2/rest/services/PropertyMapViewer/GlobalSearch/MapServer/2/query?f=json&where=ParcelID='${parcel}'&outFields=*&orderByFields=TaxYear DESC&resultRecordCount=1`;
      console.log("Query URL: " + queryUrl);
      const response = await fetch(queryUrl);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const Historicdata = await response.json();
      if (Historicdata.features && Historicdata.features.length > 0) {
        setHistoricData(Historicdata.features[0].attributes);
      } else {
        setError("No data found for the given Parcel ID.");
      }

      const zoningUrl = `https://gismaps.fultoncountyga.gov/arcgispub2/rest/services/PropertyMapViewer/GlobalSearch/MapServer/3/query?f=json&where=ParcelID='${parcel}'&outFields=*`;
      console.log("Zoning URL: " + zoningUrl);
      const zoningResponse = await fetch(zoningUrl);
      if (!zoningResponse.ok) {
        throw new Error("Network response was not ok");
      }
      const PropertyProfiledata = await zoningResponse.json();
      if (PropertyProfiledata.features && PropertyProfiledata.features.length > 0) {
        setProfileData(PropertyProfiledata.features[0].attributes);
      } else {
        setProfileData("No Profile data found.");
      }
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  React.useEffect(() => {
    if (parcelID) {
      fetchData(parcelID);
    } else {
      setHistoricData(null);
      setProfileData(null);
      setError(null);
    }
  }, [parcelID, fetchData]);

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!historicData || !profileData) {
    return <div>Loading...</div>;
  }

  const getFirstValue = (source: any, keys: string[]) => {
    for (const key of keys) {
      const value = source?.[key];
      if (value !== undefined && value !== null && `${value}`.trim() !== "") {
        return value;
      }
    }
    return "N/A";
  };

  return (
    <div className="container">
      <div className="column">
        <div className="box">
          <div className="header">Voting Information</div>
          <div className="content">
            <table>
              <tr>
                <td className="text-left">Parcel ID:</td>
                <td className="text-rightcell">{historicData.ParcelID}</td>
              </tr>
              <tr>
                <td className="text-left">Parcel Address:</td>
                <td className="text-rightcell">{historicData.Situs}</td>
              </tr>
              <tr>
                <td className="text-left">Owner:</td>
                <td className="text-rightcell">{historicData.Owner}</td>
              </tr>
              <tr>
                <td className="text-left">Mailing Address:</td>
                <td className="text-rightcell">{historicData.MailAddr}</td>
              </tr>
              <tr>
                <td className="text-left">County Precinct:</td>
                <td className="text-rightcell">{getFirstValue(profileData, ["VPrecinct", "CountyPrecinct"])}</td>
              </tr>
              <tr>
                <td className="text-left">County Poll:</td>
                <td className="text-rightcell">{getFirstValue(profileData, ["VPoll", "CountyPoll"])}</td>
              </tr>
              <tr>
                <td className="text-left">Muncipal Precinct:</td>
                <td className="text-rightcell">{getFirstValue(profileData, ["MunicipalPrecinct", "MuniPrecinct", "MuncipalPrecinct"])}</td>
              </tr>
              <tr>
                <td className="text-left">Muncipal Poll:</td>
                <td className="text-rightcell">{getFirstValue(profileData, ["MunicipalPoll", "MuniPoll", "MuncipalPoll"])}</td>
              </tr>
              <tr>
                <td className="text-left">Congressional District:</td>
                <td className="text-rightcell">{profileData.CongDist}</td>
              </tr>
              <tr>
                <td className="text-left">State Senate District:</td>
                <td className="text-rightcell">{profileData.SenateDist}</td>
              </tr>
              <tr>
                <td className="text-left">State House District:</td>
                <td className="text-rightcell">{profileData.HouseDist}</td>
              </tr>
              <tr>
                <td className="text-left">Commission District:</td>
                <td className="text-rightcell">{profileData.CommDist}</td>
              </tr>
              <tr>
                <td className="text-left">City Council District:</td>
                <td className="text-rightcell">{profileData.CounclName}</td>
              </tr>
              {(() => {
                const schDistFC = profileData.SchDistFC;
                const schDistAtl = profileData.SchDistAtl;
                const hasFC = schDistFC !== null && schDistFC !== undefined && `${schDistFC}`.trim() !== '';
                const hasAtl = schDistAtl !== null && schDistAtl !== undefined && `${schDistAtl}`.trim() !== '';
                if (hasFC) {
                  return (
                    <tr>
                      <td className="text-left">Fulton County School Board District:</td>
                      <td className="text-rightcell">{schDistFC}</td>
                    </tr>
                  );
                } else if (hasAtl) {
                  return (
                    <tr>
                      <td className="text-left">Atlanta School Board District:</td>
                      <td className="text-rightcell">{schDistAtl}</td>
                    </tr>
                  );
                }
                return null;
              })()}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
// ---------------------------------------------------------------------------



interface State {
  extent: __esri.Extent | null;
  isIdentifyMode: boolean;
  jimuMapView: JimuMapView | null;
  addressInput: string;
  loading: boolean;
  error: string | null;
  myparcelData: string;
  isActive: boolean;  // ✅ Track widget active state
  hasResults: boolean; // Track if results are displayed
}

export default class Widget extends React.PureComponent<
  AllWidgetProps<unknown>,
  State
> {
  view: __esri.MapView | null = null;
  identifyHandler: __esri.Handle | null = null;
  graphicsLayer: __esri.GraphicsLayer | null = null;
  observer: MutationObserver | null = null;
  visibilityCheckInterval: NodeJS.Timeout | null = null;

 
  
  state: State = {
    extent: null,
    isIdentifyMode: true,
    jimuMapView: null,
    addressInput: "",
    loading: false,
    error: null,
    myparcelData: "",
    isActive: true, // ✅ Default to inactive 
    hasResults: false, // No results initially
  };



  // This function is triggered when an address result is selected
  // Usage: pass parcel data and open the full Voterinfo panel directly
  openParcelDetails = (parcelID: string) => {
    const resultsDiv = document.getElementById('resultsDiv');
    const moreResultsDiv = document.getElementById('moreResultsDiv');
    this.setState({ myparcelData: parcelID }, () => {
      if (resultsDiv) {
        resultsDiv.style.display = 'none';
      }
      if (moreResultsDiv) {
        moreResultsDiv.style.display = 'block';
        moreResultsDiv.style.flex = '1';
      }
    });
  };

  isConfigured = () => {
    return (
      this.props.useMapWidgetIds && this.props.useMapWidgetIds.length === 1
    );
  };

  componentDidMount() {
    this.checkWidgetVisibility();
    window.setTimeout(() => {
      this.checkWidgetVisibility();
    }, 0);
    this.observeWidgetChanges();
    this.setupWidgetClickListener();
    // Periodically check widget visibility to catch missed state changes
    this.visibilityCheckInterval = setInterval(() => {
      this.checkWidgetVisibility();
    }, 500); // Check every 500ms
    (window as any).zoomToCoordinates = (x: number, y: number) => {
      this.zoomToCoordinates(x, y);
    };
    // Set initial message in resultsDiv
    const resultsDiv = document.getElementById('resultsDiv');
    if (resultsDiv) {
      resultsDiv.innerHTML = '<p style="color: #666; padding: 10px; margin: 5px 0; text-align: center;">Please enter your address above in the input box</p>';
    }
  }

  componentDidUpdate(prevProps: AllWidgetProps<unknown>) {
    // Detect when widget state changes (e.g., widget becomes active/inactive)
    if (prevProps.state !== this.props.state) {
      this.checkWidgetVisibility();
      // Force re-check after a short delay to ensure state is fully updated
      window.setTimeout(() => {
        this.checkWidgetVisibility();
      }, 100);
    }
  }

  componentWillUnmount() {
    if (this.graphicsLayer) {
      this.graphicsLayer.removeAll();
    }
    if (this.identifyHandler) {
      this.identifyHandler.remove();
      this.identifyHandler = null;
    }
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.visibilityCheckInterval) {
      clearInterval(this.visibilityCheckInterval);
      this.visibilityCheckInterval = null;
    }
    this.setAutoControlMapWidget(false);
  }

  checkWidgetVisibility = () => {
    this.syncFocusState();
  };

  syncFocusState = () => {
    const widgetElement =
      document.getElementById(`widget-${this.props.id}`) ||
      (document.querySelector(`[data-widgetid="${this.props.id}"]`) as HTMLElement | null);
    const isVisible = !!(
      widgetElement &&
      ((widgetElement.offsetParent || widgetElement.getClientRects().length) &&
        (widgetElement.clientWidth > 0 || widgetElement.clientHeight > 0))
    );
    const state = getAppStore().getState() as any;
    const widgetState = state?.widgetsRuntimeInfo?.[this.props.id]?.state;
    const isOpen = widgetState
      ? widgetState === WidgetState.Opened || widgetState === WidgetState.Active
      : true;
    const viewActive = !!this.state.jimuMapView;
    const nextActive = isVisible && isOpen && viewActive;

    const mapWidgetId = this.props.useMapWidgetIds?.[0];
    const autoControlId = mapWidgetId
      ? state?.mapWidgetsInfo?.[mapWidgetId]?.autoControlWidgetId
      : null;

    if (this.state.isActive !== nextActive) {
      this.setState({ isActive: nextActive }, () => {
        this.syncIdentifyHandler();
        if (nextActive && autoControlId !== this.props.id) {
          this.setAutoControlMapWidget(true);
        } else if (!nextActive && autoControlId === this.props.id) {
          this.setAutoControlMapWidget(false);
        }
      });
    } else {
      // Always sync the handler even if isActive didn't change
      // This handles cases where widget was switched but isActive state is same
      this.syncIdentifyHandler();
      if (nextActive && autoControlId !== this.props.id) {
        this.setAutoControlMapWidget(true);
      } else if (!nextActive && autoControlId === this.props.id) {
        this.setAutoControlMapWidget(false);
      }
    }
  };

  observeWidgetChanges = () => {
    const targetNode = document.body;
    if (!targetNode) return;

    this.observer = new MutationObserver(() => {
      this.checkWidgetVisibility();
    });

    this.observer.observe(targetNode, { childList: true, subtree: true });
  };

  setupWidgetClickListener = () => {
    // Add click listener to detect when user clicks on this widget
    const checkOnClick = () => {
      window.setTimeout(() => {
        this.checkWidgetVisibility();
      }, 50);
    };
    
    // Listen for clicks on the widget element
    const widgetElement = document.getElementById(`widget-${this.props.id}`) ||
      document.querySelector(`[data-widgetid="${this.props.id}"]`);
    
    if (widgetElement) {
      widgetElement.addEventListener('click', checkOnClick);
    }
    
    // Also check when any widget header is clicked (for controller/panel widgets)
    window.setTimeout(() => {
      const widgetHeaders = document.querySelectorAll(`[data-widgetid="${this.props.id}"] .widget-header, .jimu-widget-header`);
      widgetHeaders.forEach(header => {
        header.addEventListener('click', checkOnClick);
      });
    }, 1000);
  };



  getAddressVariants = (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) {
      return [] as string[];
    }

    const normalized = trimmed.replace(/\s+/g, " ");
    const tokens = normalized.split(" ");
    if (tokens.length === 0) {
      return [normalized];
    }

    const rawSuffix = tokens[tokens.length - 1];
    const suffixKey = rawSuffix.replace(/[^A-Za-z0-9]/g, "").toUpperCase();

    const suffixMap = suffixEntries.reduce<Record<string, string>>((acc, [full, abbr]) => {
      acc[full] = abbr;
      return acc;
    }, {});

    const reverseMap: Record<string, string> = {};
    Object.entries(suffixMap).forEach(([full, abbr]) => {
      if (!reverseMap[abbr]) {
        reverseMap[abbr] = full;
      }
    });

    const variants = new Set<string>();
    variants.add(normalized);

    const buildVariant = (replacement: string) => {
      const updated = [...tokens];
      updated[updated.length - 1] = replacement;
      return updated.join(" ");
    };

    if (suffixMap[suffixKey]) {
      variants.add(buildVariant(suffixMap[suffixKey]));
      variants.add(buildVariant(suffixKey));
    } else if (reverseMap[suffixKey]) {
      variants.add(buildVariant(reverseMap[suffixKey]));
      variants.add(buildVariant(suffixKey));
    }

    return Array.from(variants);
  };
  onActiveViewChange = (jimuMapView: JimuMapView) => {    
    if (!jimuMapView) {
      this.view = null;
      this.setState({ jimuMapView: null }, () => {
        this.syncFocusState();
      });
      return;
    }

    this.view = jimuMapView.view as __esri.MapView;

      if (this.view) {
        // Capture the initial extent only once
        if (!this.state.extent) {
          this.setState({ extent: this.view.extent.clone() }); // Store the initial extent
          //console.log("TEst");
        }

        // Create the graphics layer if not already created
        if (!this.graphicsLayer) {
          this.graphicsLayer = new GraphicsLayer();
          this.view.map.add(this.graphicsLayer);
        }
        if (this.state.isIdentifyMode && this.state.isActive && !this.identifyHandler) {
          this.identifyHandler = this.view.on(
            "click",
            this.handleMapClick as any
          );
        } else if ((!this.state.isIdentifyMode || !this.state.isActive) && this.identifyHandler) {
          this.identifyHandler.remove();
          this.identifyHandler = null;
        }
      }

    this.setState({ jimuMapView }, () => {
      this.syncFocusState();
      window.setTimeout(() => {
        this.syncFocusState();
      }, 0);
    });
  };

  syncIdentifyHandler = () => {
    const viewActive = !!this.state.jimuMapView;
    if (this.view && this.state.isIdentifyMode && viewActive && this.canIdentify()) {
      this.enableIdentify();
    } else {
      this.disableIdentify();
    }
  };

  canIdentify = () => {
    const mapWidgetId = this.props.useMapWidgetIds?.[0];
    if (!mapWidgetId) {
      return false;
    }
    const state = getAppStore().getState() as any;
    const autoControlId = state?.mapWidgetsInfo?.[mapWidgetId]?.autoControlWidgetId;
    if (!this.state.isActive) {
      return false;
    }
    return !autoControlId || autoControlId === this.props.id;
  };

  setAutoControlMapWidget = (shouldControl: boolean) => {
    const mapWidgetId = this.props.useMapWidgetIds?.[0];
    if (!mapWidgetId) {
      return;
    }

    const state = getAppStore().getState() as any;
    const autoControlId = state?.mapWidgetsInfo?.[mapWidgetId]?.autoControlWidgetId;
    if (shouldControl && autoControlId === this.props.id) {
      return;
    }
    if (!shouldControl && autoControlId && autoControlId !== this.props.id) {
      return;
    }

    const action = shouldControl
      ? appActions.requestAutoControlMapWidget(mapWidgetId, this.props.id)
      : appActions.releaseAutoControlMapWidget(mapWidgetId);
    getAppStore().dispatch(action);
  };

  disableIdentify = () => {
    if (this.view && this.identifyHandler) {
      this.identifyHandler.remove();
      this.identifyHandler = null;
    }
  };

  enableIdentify = () => {
    if (this.view && this.state.isIdentifyMode && this.state.jimuMapView) {
      if (this.identifyHandler) {
        return;
      }
      this.identifyHandler = this.view.on("click", this.handleMapClick as any);
    }
  };

  isOtherMapToolActive = () => {
    const container = (this.view?.container as HTMLElement) || document.body;
    const scope: ParentNode = container || document.body;
    const activeSelectors = [
      ".esri-sketch__button--selected",
      ".esri-sketch__button--active",
      ".esri-sketch__tool-button--selected",
      ".esri-sketch__tool-button--active",
      ".esri-sketch__tool-button[aria-pressed='true']",
      ".esri-sketch__button[aria-pressed='true']",
      ".measure-container .jimu-nav-link.jimu-active",
      ".measure-container .jimu-nav-link.active",
      ".measure-container .esri-distance-measurement-2d",
      ".measure-container .esri-area-measurement-2d",
      ".esri-measurement-widget__button--active",
      ".esri-distance-measurement-2d__button--active",
      ".esri-area-measurement-2d__button--active",
      ".esri-direction-measurement-2d__button--active",
      ".esri-measurement__button--active",
      ".esri-measurement__tool--active",
      ".esri-measurement .esri-widget--button[aria-pressed='true']",
      ".esri-sketch .esri-widget--button[aria-pressed='true']",
      "[class*='measurement'] .esri-widget--button[aria-pressed='true']",
      "[class*='sketch'] .esri-widget--button[aria-pressed='true']",
      ".esri-measurement calcite-action[active]",
      ".esri-measurement calcite-action[aria-pressed='true']",
      ".esri-measurement calcite-action[checked]",
      ".esri-measurement calcite-segmented-control-item[checked]",
      ".esri-distance-measurement-2d calcite-segmented-control-item[checked]",
      ".esri-area-measurement-2d calcite-segmented-control-item[checked]",
      ".esri-measurement calcite-button[aria-pressed='true']",
      ".esri-measurement calcite-button[active]"
    ];

    const activeEls = Array.from(
      scope.querySelectorAll(activeSelectors.join(", "))
    ) as HTMLElement[];

    const measurePanels = Array.from(
      scope.querySelectorAll(
        ".measure-container .esri-distance-measurement-2d, .measure-container .esri-area-measurement-2d"
      )
    ) as HTMLElement[];

    const isVisible = (el: HTMLElement) =>
      !!(el.offsetParent || el.getClientRects().length);

    if (measurePanels.some(isVisible)) {
      return true;
    }

    const measurePopper = scope.querySelector(
      "#jimu-overlays-container .map-tool-popper .panel-title[title='Measure']"
    ) as HTMLElement | null;

    if (measurePopper) {
      const popper = measurePopper.closest(
        ".map-tool-popper"
      ) as HTMLElement | null;
      const popperVisible = popper ? isVisible(popper) : isVisible(measurePopper);
      const referenceHidden = popper?.getAttribute("data-popper-reference-hidden");
      if (popperVisible && referenceHidden !== "true") {
        return true;
      }
    }

    const viewContainer = this.view?.container as HTMLElement | undefined;
    if (viewContainer) {
      const classList = viewContainer.classList;
      if (
        classList.contains("esri-cursor-crosshair") ||
        classList.contains("esri-cursor-measure") ||
        classList.contains("esri-cursor-draw")
      ) {
        return true;
      }
    }

    if (activeEls.length === 0) {
      return false;
    }

    if (activeEls.some((el) => {
      const ariaPressed = el.getAttribute("aria-pressed");
      const ariaChecked = el.getAttribute("aria-checked");
      const dataState = el.getAttribute("data-state");
      const active = el.getAttribute("active");
      return (
        ariaPressed === "true" ||
        ariaChecked === "true" ||
        dataState === "active" ||
        active === ""
      );
    })) {
      return true;
    }

    const measurementHost = scope.querySelector(
      ".esri-measurement, .esri-distance-measurement-2d, .esri-area-measurement-2d"
    ) as HTMLElement | null;

    if (measurementHost) {
      const dataActiveTool = measurementHost.getAttribute("data-active-tool");
      const activeTool = measurementHost.getAttribute("active-tool");
      const dataTool = measurementHost.getAttribute("data-tool");
      const dataMode = measurementHost.getAttribute("data-mode");
      if (dataActiveTool || activeTool || dataTool || dataMode) {
        return true;
      }
    }

    return false;
  };

  handleAddressInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ addressInput: event.target.value });
  };

  handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    this.handleSearchClick();
  };

  handleSearchClick = () => {
    const resultsDiv = document.getElementById('resultsDiv');
    const moreResultsDiv = document.getElementById('moreResultsDiv');
    if (!resultsDiv || !moreResultsDiv) {
      return;
    }
    
    // Check if input is empty
    if (!this.state.addressInput.trim()) {
      resultsDiv.innerHTML = '<p style="color: #d32f2f; padding: 10px; margin: 5px 0;">Please enter an address to search.</p>';
      resultsDiv.style.display = 'block';
      moreResultsDiv.style.display = 'none';
      this.setState({ hasResults: false });
      return;
    }
    
    resultsDiv.innerHTML = "";
    // Hide resultsDiv and show moreResultsDiv
    resultsDiv.style.display = 'block';
    moreResultsDiv.style.display = 'none';
    resultsDiv.style.flex = '1';

    this.fetchAddressResults(this.state.addressInput);
  };

  // New clear button function
  handleClearClick = () => {
    const resultsDiv = document.getElementById("resultsDiv");
    const moreResultsDiv = document.getElementById("moreResultsDiv");
    if (resultsDiv) {
      resultsDiv.innerHTML = '<p style="color: #666; padding: 10px; margin: 5px 0; text-align: center;">Please enter your address above in the input box</p>';
      resultsDiv.style.display = 'block';
    }
    if (moreResultsDiv) {
      moreResultsDiv.style.display = 'none';
    }

    if (this.graphicsLayer) {
      this.graphicsLayer.removeAll();
    }

    if (this.view && this.state.extent) {
      this.view.goTo(this.state.extent); // Use the stored initial extent
    }
    this.setState({
      addressInput: "", // Clear the addressInput field
      hasResults: false // Hide Clear button
    });
  };

  handleMapClick = async (event: __esri.ViewClickEvent) => {
    if (!this.canIdentify()) {
      return;
    }
    if (this.isOtherMapToolActive()) {
      return;
    }
    //console.log("Map clicked at screen coordinates: " + event.x + ", " + event.y);
    const resultsDiv = document.getElementById("resultsDiv");
    const moreResultsDiv = document.getElementById("moreResultsDiv");

    if (resultsDiv) {
      resultsDiv.innerHTML = '';
      resultsDiv.style.display = 'none';
    }
    if (moreResultsDiv) {
      moreResultsDiv.style.display = 'none';
    }
    
    console.log(this.state.isIdentifyMode);
  
    
    
    if (this.view) {
    
      const screenPoint = { x: event.x, y: event.y };
      const mapPoint = this.view.toMap(screenPoint);
      this.zoomToCoordinates(mapPoint.x, mapPoint.y);
    }
  };

  // New function to get data from MapService
  fetchAddressResults = async (addressInput: string) => {
    const resultsDiv = document.getElementById("resultsDiv");
    
    if (!addressInput.trim()) {
      console.log("Please enter an address");
      return;
    }

    try {
      this.setState({ loading: true, error: null });
      // Base layer URL and query endpoint
      const layerUrl = 'https://gismaps.fultoncountyga.gov/arcgispub2/rest/services/PropertyMapViewer/GlobalSearch/MapServer/1';
      const queryUrl = `${layerUrl}/query`;
      console.log(layerUrl);
      // Fetch layer metadata to determine display field (if available)
      let displayField = 'Name';
      try {
        const metaResp = await fetch(`${layerUrl}?f=json`);
        if (metaResp.ok) {
          const meta = await metaResp.json();
          displayField = meta.displayField || meta.displayFieldName || displayField;
        }
      } catch (e) {
        console.warn('Failed to fetch layer metadata, using fallback display field', e);
      }

      const variants = this.getAddressVariants(addressInput);
      const escapedVariants = variants.map((value) => value.replace(/'/g, "''"));
      const fieldsToSearch = Array.from(new Set(["Name", displayField].filter(Boolean)));
      const whereParts = escapedVariants.map((value) =>
        fieldsToSearch.map((field) => `${field} LIKE '${value}%'`).join(" OR ")
      );

      const params = {
        // Search using both raw and abbreviated street type variants
        where: whereParts.length > 0 ? `(${whereParts.join(") OR (")})` : "1=0",
        outFields: '*',
        returnGeometry: true,
        f: 'json'
      };

      const queryString = new URLSearchParams(params as any).toString();
      const response = await fetch(`${queryUrl}?${queryString}`);

      if (!response.ok) {
        throw new Error('Network error. Please try again later.');
      }

      const data = await response.json();

      if (!data.features || data.features.length === 0) {
        console.log('No results found for the given address.');
        if (resultsDiv) {
          resultsDiv.innerHTML = "No results found for the given address.";
        }
      } else if (data.features.length > 500) {
        console.log('More than 500 results for the given address.');
        if (resultsDiv) {
          resultsDiv.innerHTML = "More than 500 results found for the given address. Please narrow down your search.";
        }
      } else {
        // Group the data by a field (e.g., FeatType if available)
        const groupedData = data.features.reduce((acc: any, feature: any) => {
          const featType = feature.attributes?.['FeatType'] || 'Result';
          if (!acc[featType]) {
            acc[featType] = [];
          }

          const geometry = feature.geometry || {};
          let labelX = 0;
          let labelY = 0;

          // If point geometry is provided
          if (typeof geometry.x === 'number' && typeof geometry.y === 'number') {
            labelX = geometry.x;
            labelY = geometry.y;
          }
          // If polygon geometry (rings) provided, use first coordinate of first ring
          else if (
            geometry.rings &&
            Array.isArray(geometry.rings) &&
            geometry.rings.length > 0 &&
            Array.isArray(geometry.rings[0]) &&
            geometry.rings[0].length > 0 &&
            Array.isArray(geometry.rings[0][0]) &&
            geometry.rings[0][0].length >= 2
          ) {
            const firstPoint = geometry.rings[0][0];
            labelX = firstPoint[0];
            labelY = firstPoint[1];
          }
          // Fallback to LabelX/LabelY attributes if present
          else if (feature.attributes && feature.attributes.LabelX !== undefined && feature.attributes.LabelY !== undefined) {
            labelX = Number(feature.attributes.LabelX) || 0;
            labelY = Number(feature.attributes.LabelY) || 0;
          } else {
            console.warn('Feature missing usable geometry or label attributes', feature);
          }

          // Determine display name: prefer layer displayField, then handle Tax Parcels specially,
          // then fallback to Name/Address or Unknown.
          const ftLower = (featType || '').toString().toLowerCase();
          let nameVal: string | undefined;
          
          if (ftLower.includes('address')) {
            // For Addresses, prioritize Display field (has full address with City/Zip), then displayField
            nameVal = feature.attributes?.['Display'] || feature.attributes?.[displayField] || feature.attributes?.['Name'] || feature.attributes?.['Address'] || 'Unknown';
          } else if (ftLower.includes('parcel') || ftLower.includes('tax')) {
            const addr = feature.attributes?.['Address'] || feature.attributes?.['ADDR'] || '';
            const pid = feature.attributes?.['ParcelID'] || feature.attributes?.['PARCELID'] || feature.attributes?.['PARCEL_ID'] || '';
            if (addr && pid) {
              nameVal = `${addr} (${pid})`;
            } else if (addr) {
              nameVal = addr;
            } else if (pid) {
              nameVal = pid;
            } else {
              nameVal = feature.attributes?.['Name'] || 'Parcel';
            }
          } else {
            nameVal = feature.attributes?.[displayField] || feature.attributes?.['Name'] || feature.attributes?.['Address'] || 'Unknown';
          }

          acc[featType].push({
            name: nameVal,
            labelX,
            labelY,
            attributes: feature.attributes
          });
          return acc;
        }, {});

        if (resultsDiv) {
          this.renderResults(groupedData, resultsDiv);
        }
      }
    } catch (error) {
      console.error('Error fetching data from MapService:', error);
      this.setState({ error: 'An error occurred. Please try again later.' });
      if (resultsDiv) {
        resultsDiv.innerHTML = 'An error occurred. Please try again later.';
      }
    } finally {
      this.setState({ loading: false });
    }
  };

  
  renderResults = (groupedData: any, resultsDiv: HTMLElement) => {
    // Sort categories: Addresses first, then Parcels/Tax, then alphabetically
    const sortedEntries = Object.entries(groupedData).sort(([typeA], [typeB]) => {
      const aLower = (typeA || '').toLowerCase();
      const bLower = (typeB || '').toLowerCase();
      
      if (aLower.includes('address')) return -1;
      if (bLower.includes('address')) return 1;
      if (aLower.includes('parcel') || aLower.includes('tax')) return -1;
      if (bLower.includes('parcel') || bLower.includes('tax')) return 1;
      return aLower.localeCompare(bLower);
    });

    const groupedHTML = (sortedEntries as Array<[string, any[]]>)
      .map(([featType, items]) => {
        // Sort items by name, then by coordinates for deterministic order
        const sortedItems = (items as any[]).sort((a: any, b: any) => {
          const nameA = (a.name || '').toLowerCase();
          const nameB = (b.name || '').toLowerCase();
          if (nameA < nameB) return -1;
          if (nameA > nameB) return 1;
          if ((a.labelX || 0) < (b.labelX || 0)) return -1;
          if ((a.labelX || 0) > (b.labelX || 0)) return 1;
          if ((a.labelY || 0) < (b.labelY || 0)) return -1;
          if ((a.labelY || 0) > (b.labelY || 0)) return 1;
          return 0;
        });

        return `
          <h3>${featType}</h3>
          <ul>
            ${sortedItems
              .map(
                item => `
                <li>
                  <a href="#" onclick="window.zoomToCoordinates(${item.labelX}, ${item.labelY}); return false;" style="color: blue; text-decoration: none;" aria-label="Zoom to ${item.name} on map" title="Zoom to ${item.name} on map">
                    ${item.name}
                  </a>
                </li>`
              )
              .join('')}
          </ul>
        `;
      })
      .join('');
  
    resultsDiv.innerHTML = `
      <p>Found ${Object.values(groupedData).flat().length} results for the given address.</p>
      ${groupedHTML}
    `;
    this.setState({ hasResults: true }); // Show Clear button
  };

  // New function to zoom to predefined coordinates
  zoomToCoordinates = async (x: number, y: number) => {
    console.log("Zooming to coordinates:", x, y);
    // alert("inside zoom To Coordinates");
    const [Graphic, Polygon, Point] = await loadModules([
      "esri/Graphic",
      "esri/geometry/Polygon",
      "esri/geometry/Point",
    ]);
    const mapPoint = new Point({
      x: x,
      y: y,
      spatialReference: { wkid: 2240 },
    });
    // Clear previous graphics
    if (this.graphicsLayer) {
      this.graphicsLayer.removeAll();
    }
    const url =
      "https://gismaps.fultoncountyga.gov/arcgispub2/rest/services/PropertyMapViewer/ParcelQuery/MapServer/identify";

    const spatialReferenceWkid = 2240;
    const fetchIdentify = async (tolerance: number, extentPadding: number) => {
      const params = {
        f: "json",
        geometry: JSON.stringify({
          x,
          y,
          spatialReference: {
            wkid: spatialReferenceWkid,
          },
        }),
        geometryType: "esriGeometryPoint",
        sr: spatialReferenceWkid,
        tolerance,
        returnGeometry: true, // Request geometry to get parcel polygon
        mapExtent: JSON.stringify({
          xmin: x - extentPadding,
          ymin: y - extentPadding,
          xmax: x + extentPadding,
          ymax: y + extentPadding,
          spatialReference: { wkid: spatialReferenceWkid },
        }),
        imageDisplay: [800, 600, 96],
        layers: "all",
      };

      const response = await request(url, {
        query: params,
        responseType: "json",
      });

      return response.data;
    };

    try {
      let result = await fetchIdentify(10, 1000);
      if (!result?.results || result.results.length === 0) {
        result = await fetchIdentify(50, 3000);
      }

      console.log("Total results = ", result.results.length);
      if (result.results && result.results.length > 0) {
        console.log("Results returned = ", result.results.length);
        const features = result.results[0]?.geometry;
        if (features) {
          const polygon = new Polygon({
            rings: features.rings,
            spatialReference: { wkid: spatialReferenceWkid },
          });

          const polygonGraphic = new Graphic({
            geometry: polygon,
            symbol: {
              type: "simple-fill",
              color: [0, 0, 255, 0.2], // Fill color with transparency
              outline: {
                color: [0, 0, 255, 1],
                width: 2,
              },
            },
          });

          if (this.graphicsLayer) {
            this.graphicsLayer.add(polygonGraphic);
          }
          const parcelID = result.results[0].attributes?.ParcelID;
          if (parcelID) {
            this.openParcelDetails(parcelID);
            this.setState({ hasResults: true });
          }
        }
      }
      else{
        const resultsDiv = document.getElementById("resultsDiv");
        if (resultsDiv) {
          resultsDiv.innerHTML = "No results returned";
        }
      }
    } catch (error) {
      console.error("Identify error:", error);
    }
    try {
      if (this.view) {
        await this.view
          .goTo({
            target: mapPoint, // Use the Point as the target
            zoom: 9, // Adjust zoom level as needed
          })
          .then(() => {
            console.log("View centered on:", mapPoint);
          })
          .catch((error) => {
            console.error("Error centering the view:", error);
          });
      }
    } catch (error) {
      console.error("Zoom error:", error);
    }
  };  

  render() {
    if (!this.isConfigured()) {
      return "In Widget Configuration, please select a map";
    }
    const { loading, error, addressInput } = this.state;
    return (
      <div
        className="widget-use-map-view">
        <JimuMapViewComponent
          useMapWidgetId={this.props.useMapWidgetIds?.[0]}
          onActiveViewChange={this.onActiveViewChange}
        ></JimuMapViewComponent>

        <SearchPanel
          addressInput={addressInput}
          hasResults={this.state.hasResults}
          onFormSubmit={this.handleFormSubmit}
          onAddressInputChange={this.handleAddressInputChange}
          onSearchClick={this.handleSearchClick}
          onClearClick={this.handleClearClick}
        />

        <ResultsArea
          loading={loading}
          error={error}
          loadingImageSrc={loadingAnimate}
        />

        <div id="moreResultsDiv" style={{ display: "none" }}>
          <div
            id="parcelInfo"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {this.state.myparcelData ? (
              <Voterinfo
                parcelID={this.state.myparcelData}
                key={this.state.myparcelData}
              />
            ) : (
              <div>No parcel data yet.</div>
            )}
          </div>
        </div>
    </div>
    );
  }
}
