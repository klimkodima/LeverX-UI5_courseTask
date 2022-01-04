sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/model/odata/v2/ODataModel"
], function(UIComponent, ODataModel) {
    "use strict";

    return UIComponent.extend("dzmitry.klimko.Component", {
        metadata: {
            manifest: "json"
        },

        init: function() {

            UIComponent.prototype.init.apply(this, arguments)
            this.getRouter().initialize();
        }
    });
});