sap.ui.define([
    "./BaseController",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/format/DateFormat",
    "sap/m/MessageToast",
    "sap/ui/model/Sorter",
    "../model/formatter"
], function(BaseController, Filter, FilterOperator, DateFormat, MessageToast, Sorter, formatter) {
    "use strict";

    return BaseController.extend("dzmitry.klimko.controller.ProductDetails", {

        formatter: formatter,

        /**
        /**
		 * Controller's "init" lifecycle method.
		*/
        onInit: function() {
            var oComponent = this.getOwnerComponent();
            var oRouter = oComponent.getRouter();

            // get the route object from router attach event handler, that will be called once the URL will match
            // the pattern of a route
            oRouter.getRoute("ThirdPage").attachPatternMatched(this.onPatternMatched, this);
        },

        /**
         * Event handler for navigating back.
         * We navigate back to first page
         * @public
         */
        onNavToStoresList: function() {
            this.getOwnerComponent().getRouter().navTo("FirstPage");
        },


        /**
         * Updates the model with the user comments on Products.
         * 
         * @param {sap.ui.base.Event} oEvent object of the user input
         * 
         * @public
         */
        onCreateProductComment: function(oEvent) {
            var oFormat = DateFormat.getDateTimeInstance({ style: "short" });
            var oODataModel = this.getModel("odata");
            var oCtx = oEvent.getSource().getBindingContext("odata");
            var rating = this.byId("authorInput").getValue();
            var author = this.byId("ratingInput").getValue();
            var oEntryCtx = oODataModel.createEntry("/ProductComments", {
                properties: {
                    ProductId: oCtx.getObject("id"),
                    Posted: oFormat.format(new Date()),
                    Message: oEvent.getParameter("value"),
                    Rating: author,
                    Author: rating
                }
            });

            this.getView().setBindingContext(oEntryCtx);
            if (rating && author) {
                oODataModel.submitChanges();
                oODataModel.refresh();
                MessageToast.show(this.i18n("successCreateCommentMsg"));
                this.byId("ratingInput").setValue(0);
                this.byId("authorInput").setValue("");
            } else {
                MessageToast.show(this.i18n("errorCreateCommentMsg"));
            }
        },

        /**
         * "SecondPage" route pattern matched event handler.
         *
         * @param {sap.ui.base.Event} oEvent event object.
         * 
         * @private
         */
        onPatternMatched: function(oEvent) {
            var that = this;
            var mRouteArguments = oEvent.getParameter("arguments");
            var sProductID = mRouteArguments.id;
            var oODataModel = this.getModel("odata");
            var oBinding = that.byId("idCommentsList").getBinding("items");

            oODataModel.metadataLoaded().then(function() {
                var sKey = oODataModel.createKey("/Products", { id: sProductID });

                that.getView().bindObject({
                    path: sKey,
                    model: "odata"
                });
                oBinding.filter(new Filter("ProductId", FilterOperator.EQ, sProductID));
                oBinding.sort(new Sorter("Posted", true));
            });
        },

    });
});