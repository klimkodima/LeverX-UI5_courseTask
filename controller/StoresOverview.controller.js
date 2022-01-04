sap.ui.define([
    "./BaseController",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/SimpleType",
    "sap/ui/model/ValidateException",
    "sap/ui/core/Core",
], function(BaseController, Filter, FilterOperator, MessageToast, MessageBox, SimpleType, ValidateException, Core) {
    "use strict";

    return BaseController.extend("dzmitry.klimko.controller.StoresOverview", {

        /**
         * Open  page store item press event handler.
         * 
         * @param {sap.ui.base.Event} oEvent event object.
         * 
         * @public
         */
        onShowStoreDetails: function(oEvent) {
            var oItem = oEvent.getSource();
            var oCtx = oItem.getBindingContext("odata");
            this.getOwnerComponent().getRouter().navTo("SecondPage", {
                id: oCtx.getObject("id")
            });
        },

        /**
         * "Search" event handler of the "searchStoresField".
         *
         * @param {sap.ui.base.Event} oEvent event object.
         * 
         * @public
         */

        onStoresSearch: function(oEvent) {
            var oStoresList = this.byId("storesList");
            var oItemsBinding = oStoresList.getBinding("items");
            var sQuery = oEvent.getParameter("query");
            if (sQuery && sQuery.length > 0) {


                var oFilterByNumber = new Filter({
                    filters: [
                        new Filter("Name", FilterOperator.Contains, sQuery),
                        new Filter("Address", FilterOperator.Contains, sQuery),
                        new Filter("FloorArea", FilterOperator.EQ, sQuery),
                    ]
                });
                var oFilterByText = new Filter({
                    filters: [
                        new Filter("Name", FilterOperator.Contains, sQuery),
                        new Filter("Address", FilterOperator.Contains, sQuery),
                    ]
                })
            }
            if (parseInt(sQuery)) {
                oItemsBinding.filter(oFilterByNumber);
            } else {
                oItemsBinding.filter(oFilterByText);
            }

        },

        /**
         * "Open dialog" button press event handler.
         * 
         * @public
         */
        onCreateStore: function() {
            var oView = this.getView();
            var oODataModel = oView.getModel("odata");
            var oMM = Core.getMessageManager();
            var oEntryCtx = oODataModel.createEntry("/Stores");

            if (!this.oDialog) {
                this.oDialog = sap.ui.xmlfragment(oView.getId(), "dzmitry.klimko.view.fragments.CreateStore", this);
                oView.addDependent(this.oDialog);
            }
            this.oDialog.setBindingContext(oEntryCtx);
            this.oDialog.setModel(oODataModel);
            this.oDialog.open();
            // attach handlers for validation errors
            oMM.registerObject(oView.byId("storeNameInput"), true);
            oMM.registerObject(oView.byId("storeEmailInput"), true);
            oMM.registerObject(oView.byId("storeAddressInput"), true);
            oMM.registerObject(oView.byId("storePhoneNumberInput"), true);
            oMM.registerObject(oView.byId("storeEstablishedInput"), true);
            oMM.registerObject(oView.byId("storeFloorAreaInput"), true);
        },

        /**
         * "Cancel" button press event handler (in the dialog).
         * 
         * @public
         */
        onCancelCreateStore: function() {
            var oODataModel = this.getModel("odata");
            var oCtx = this.oDialog.getBindingContext();

            oODataModel.deleteCreatedEntry(oCtx);
            this.oDialog.close();
        },

        /**
         * "Confirm create store" button press event handler.
         * 
         * @public
         */
        onConfirmCreateStore: function() {
            var oView = this.getView(),
                aInputs = [
                    oView.byId("storeNameInput"),
                    oView.byId("storeEmailInput"),
                    oView.byId("storeAddressInput"),
                    oView.byId("storePhoneNumberInput"),
                    oView.byId("storeEstablishedInput"),
                    oView.byId("storeFloorAreaInput"),
                ],
                bValidationError = false;

            aInputs.forEach(function(oInput) {
                bValidationError = this._validateInput(oInput) || bValidationError;
            }, this);

            if (!bValidationError) {
                var oODataModel = this.getModel("odata");
                oODataModel.submitChanges();
                oODataModel.refresh();
                MessageToast.show(this.i18n("successCreateStoreMsg"));
                this.oDialog.close();
            } else {
                MessageBox.alert(this.i18n("errorCreateStoreMsg"));
            }
        },

        /**
         * Custom model type for validating an E-Mail address
         * @class
         * @extends sap.ui.model.SimpleType
         * 
         * @private
         */
        customEMailType: SimpleType.extend("email", {
            formatValue: function(oValue) {
                return oValue;
            },
            parseValue: function(oValue) {
                return oValue;
            },
            validateValue: function(oValue) {
                var rexMail = /^\w+[\w-+\.]*\@\w+([-\.]\w+)*\.[a-zA-Z]{2,}$/;
                if (!oValue.match(rexMail)) {
                    throw new ValidateException("'" + oValue + "' is not a valid e-mail address");
                }
            }
        }),

        /**
         * Validate input field.
         *
         * @param  oInput input field object.
         * 
         * @returns {boolean} validation error if it exists.
         * 
         * @private
         */
        _validateInput: function(oInput) {
            var sValueState = "None";
            var bValidationError = false;
            var oBinding = oInput.getBinding("value");

            try {
                oBinding.getType().validateValue(oInput.getValue());
            } catch (oException) {
                sValueState = "Error";
                bValidationError = true;
            }
            oInput.setValueState(sValueState);
            return bValidationError;
        },

    });
});