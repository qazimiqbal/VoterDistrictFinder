import { React, Immutable, DataSourceManager, DataSourceTypes } from "jimu-core";
import { type AllWidgetSettingProps } from "jimu-for-builder";
import { MapWidgetSelector } from "jimu-ui/advanced/setting-components";

export default class Setting extends React.PureComponent<
  AllWidgetSettingProps<unknown>,
  unknown
> {
  supportedTypes = Immutable([DataSourceTypes.WebMap]);
  dsManager = DataSourceManager.getInstance();

  onMapSelected = (useMapWidgetIds: string[]) => {
    this.props.onSettingChange({
      id: this.props.id,
      useMapWidgetIds: useMapWidgetIds,
    });
  };

  render() {
    return (
      <div className="sample-use-map-view-setting p-2">
        <MapWidgetSelector
          onSelect={this.onMapSelected}
          useMapWidgetIds={this.props.useMapWidgetIds}
          // supportedTypes={this.supportedTypes} // optional: add this if needed
        />
      </div>
    );
  }
}

