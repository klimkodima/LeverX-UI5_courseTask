sap.ui.define([
    "./BaseController",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Sorter",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/Core",
    "../model/formatter"
], function(BaseController, Filter, FilterOperator, JSONModel,
    Sorter, MessageToast, MessageBox, Core, formatter) {
    "use strict";

    var SORT_NONE = "SORT_NONE";
    var SORT_ASC = "ASC";
    var SORT_DESC = "DESC";

    return BaseController.extend("dzmitry.klimko.controller.StoreDetails", {
        formatter: formatter,
        /**
        /**
		 * Controller's "init" lifecycle method.
		*/
        onInit: function() {
            this.previousButton;
            const oComponent = this.getOwnerComponent();
            const oRouter = oComponent.getRouter();
            this._oTable = this.byId("table");

            // Create an object of filters
            this._mFilters = {
                "inStock": [new Filter("Status", FilterOperator.Contains, "OK")],
                "outStock": [new Filter("Status", FilterOperator.Contains, "OUT_OF_STOCK")],
                "storage": [new Filter("Status", FilterOperator.Contains, "STORAGE")],
                "all": []
            };
            oRouter.getRoute("SecondPage").attachPatternMatched(this.onPatternMatched, this);
            var oAppViewModel = new JSONModel({
                sortType: SORT_NONE,
                storeId: 0,
                sortProperty: "",
                edit: false
            });
            this.oAppViewModel = oAppViewModel;
            this.setModel(oAppViewModel, "appView");
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
            var sStoresID = mRouteArguments.id;
            var oODataModel = this.getModel("odata");

            oODataModel.metadataLoaded().then(function() {
                var sKey = oODataModel.createKey("/Stores", { id: sStoresID });

                that.getView().bindObject({
                    path: sKey,
                    model: "odata"
                });
            });

        },

        /**
         * "Edit" product button press event handler.
         *
         * @param {sap.ui.base.Event} oEvent event object
         * 
         * @public
         */
        onEditProduct: function(oEvent) {
            this.oAppViewModel.setProperty("/edit", true);
            var oView = this.getView();
            var oODataModel = this.getModel("odata");
            var oMM = Core.getMessageManager();
            var oItem = oEvent.getSource();
            var oCtx = oItem.getBindingContext("odata");

            if (!this.pDialog) {
                this.pDialog = sap.ui.xmlfragment(oView.getId(), "dzmitry.klimko.view.fragments.EditProduct", this);
                oView.addDependent(this.pDialog);
            }
            this.pDialog.setModel(oODataModel);
            this.pDialog.setBindingContext(oCtx);
            this.pDialog.open();
            // attach handlers for validation errors
            oMM.registerObject(oView.byId("editProductNameInput"), true);
            oMM.registerObject(oView.byId("editProductPriceInput"), true);
            oMM.registerObject(oView.byId("editProductSpecsInput"), true);
            oMM.registerObject(oView.byId("editProductRatingInput"), true);
            oMM.registerObject(oView.byId("editProductSupplierInfoInput"), true);
            oMM.registerObject(oView.byId("editProductMadeInInput"), true);
            oMM.registerObject(oView.byId("editProductProdCompInput"), true);
        },

        /**
         * "Delete" product button press event handler.
         *
         * @param {sap.ui.base.Event} oEvent event object
         * 
         * @public
         */
        onDeleteProduct: function(oEvent) {
            var oCtx = oEvent.getSource().getBindingContext("odata");
            var oODataModel = oCtx.getModel();
            var sKey = oODataModel.createKey("/Products", oCtx.getObject());
            var errorMessage = this.i18n("errorDeleteProductMsg");
            var successMessage = this.i18n("successDeleteProductMsg");

            MessageBox.confirm(this.i18n("confirmDeleteProductMsg"), {
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                onClose: function(sAction) {
                    if (sAction === "OK") {
                        oODataModel.remove(sKey, {
                            success: function() {
                                MessageToast.show(successMessage);
                            },
                            error: function() {
                                MessageBox.error(errorMessage);
                            }
                        });
                    }
                }
            });
        },

        /**
         * Open  page product cell press event handler.
         * 
         * @public
         */
        onShowProductDetails: function(oEvent) {
            var oItem = oEvent.getSource();
            var oCtx = oItem.getBindingContext("odata");
            this.getOwnerComponent().getRouter().navTo("ThirdPage", {
                id: oCtx.getObject("id")
            });
        },

        /**
         * Set statuses products in Icon Bar.
         * 
         * @private
         */
        onAfterRendering: function() {
            var oODataModel = this.getModel("odata");
            var oTable = this.byId("table");
            var oBinding = oTable.getBinding("items");
            var oAppView = this.getModel("appView");

            oBinding.attachDataReceived(function() {
                var oCtx = oTable.getBindingContext("odata");
                var sStoresPath = oODataModel.createKey("/Stores", oCtx.getObject());
                var statuses = ["ALL", "OK", "STORAGE", "OUT_OF_STOCK"];

                statuses.forEach(function(status) {
                    var oParams = {
                        success: function(sCount) {
                            oAppView.setProperty(
                                "/" + status.toLowerCase() + "ProductsCount",
                                sCount
                            );
                        },
                    };

                    if (status !== "ALL") {
                        oParams.filters = [
                            new Filter("Status", FilterOperator.EQ, status),
                        ];
                    }

                    oODataModel.read(sStoresPath + "/rel_Products/$count", oParams);
                });
            });
        },

        /**
         * "Search" event handler of the "searchProductsField".
         *
         * @param {sap.ui.base.Event} oEvent event object.
         * 
         * @public
         */
        onProductsSearch: function(oEvent) {
            var oProductsList = this.byId("table");
            var oItemsBinding = oProductsList.getBinding("items");
            var sQuery = oEvent.getParameter("query");
            if (sQuery && sQuery.length > 0) {
                var oFilterByNumber = new Filter({
                    filters: [
                        new Filter("Name", FilterOperator.Contains, sQuery),
                        new Filter("Specs", FilterOperator.Contains, sQuery),
                        new Filter("SupplierInfo", FilterOperator.Contains, sQuery),
                        new Filter("MadeIn", FilterOperator.Contains, sQuery),
                        new Filter("ProductionCompanyName", FilterOperator.Contains, sQuery),
                        new Filter("Price", FilterOperator.EQ, sQuery),
                        new Filter("Rating", FilterOperator.EQ, sQuery)
                    ]
                });
                var oFilterByText = new Filter({
                    filters: [
                        new Filter("Name", FilterOperator.Contains, sQuery),
                        new Filter("Specs", FilterOperator.Contains, sQuery),
                        new Filter("SupplierInfo", FilterOperator.Contains, sQuery),
                        new Filter("MadeIn", FilterOperator.Contains, sQuery),
                        new Filter("ProductionCompanyName", FilterOperator.Contains, sQuery),
                    ],
                });
            }
            if (parseInt(sQuery)) {
                oItemsBinding.filter(oFilterByNumber);
            } else {
                oItemsBinding.filter(oFilterByText);
            }
        },

        /**
         * "Delete" store button press event handler.
         *
         * @param {sap.ui.base.Event} oEvent event object
         * 
         * @public
         */
        onDeleteStore: function(oEvent) {
            var oCtx = oEvent.getSource().getBindingContext("odata");
            var oODataModel = oCtx.getModel();
            var sKey = oODataModel.createKey("/Stores", oCtx.getObject());
            var errorMessage = this.i18n("errorDeleteStoreMsg");
            var successMessage = this.i18n("successDeleteStoreMsg");

            MessageBox.confirm(this.i18n("confirmDeleteStoreMsg"), {
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                onClose: function(sAction) {
                    if (sAction === "OK") {
                        oODataModel.remove(sKey, {
                            success: function() {
                                MessageToast.show(successMessage);
                            },
                            error: function() {
                                MessageBox.error(errorMessage);
                            }
                        });
                    }
                }
            });
        },

        /**
         * "Open dialog" button press event handler.
         * 
         *  @param {sap.ui.base.Event} oEvent event object
         * 
         * @public
         */
        onCreateProduct: function(oEvent) {
            var oView = this.getView();
            var oODataModel = this.getModel("odata");
            var oMM = Core.getMessageManager();
            var oItem = oEvent.getSource();
            var oCtx = oItem.getBindingContext("odata");
            var id = oCtx.getObject("id");
            var oEntryCtx = oODataModel.createEntry("/Products", {
                properties: {
                    StoreId: id,
                    Status: "OK"
                }
            });

            if (!this.oDialog) {
                this.oDialog = sap.ui.xmlfragment(oView.getId(), "dzmitry.klimko.view.fragments.CreateProduct", this);
                oView.addDependent(this.oDialog);
            }
            this.oDialog.setBindingContext(oEntryCtx);
            this.oDialog.setModel(oODataModel);
            this.oDialog.open();
            // attach handlers for validation errors
            oMM.registerObject(oView.byId("productNameInput"), true);
            oMM.registerObject(oView.byId("productPriceInput"), true);
            oMM.registerObject(oView.byId("productSpecsInput"), true);
            oMM.registerObject(oView.byId("productRatingInput"), true);
            oMM.registerObject(oView.byId("productSupplierInfoInput"), true);
            oMM.registerObject(oView.byId("productMadeInInput"), true);
            oMM.registerObject(oView.byId("productProdCompInput"), true);
        },

        /**
         * "Cancel create product" button press event handler (in the dialog).
         * 
         * @public
         */
        onCancelCreateProduct: function() {
            var oODataModel = this.getModel("odata");
            var oCtx = this.oDialog.getBindingContext();

            oODataModel.deleteCreatedEntry(oCtx);
            this.oDialog.close();
        },


        /**
         * "Cancel edit product" button press event handler (in the dialog).
         * 
         * @public
         */
        onCancelEditProduct: function() {
            var oODataModel = this.getModel("odata");

            oODataModel.resetChanges();
            this.pDialog.close();
        },

        /**
         * Validate input field.
         *
         * @param {Object} oInput input field object.
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

        /**
         * "Confirm create product" button press event handler.
         * 
         * @public
         */
        onConfirmCreateProduct: function() {
            // collect input controls
            var oView = this.getView(),
                aInputs = [
                    oView.byId("productNameInput"),
                    oView.byId("productPriceInput"),
                    oView.byId("productSpecsInput"),
                    oView.byId("productRatingInput"),
                    oView.byId("productSupplierInfoInput"),
                    oView.byId("productMadeInInput"),
                    oView.byId("productProdCompInput"),
                ],
                bValidationError = false;

            aInputs.forEach(function(oInput) {
                bValidationError = this._validateInput(oInput) || bValidationError;
            }, this);

            if (!bValidationError) {
                var oODataModel = this.getModel("odata");
                var status = this.byId("productStatusInput")

                oODataModel.submitChanges();
                oODataModel.refresh();
                MessageToast.show(this.i18n("successCreateProductMsg"));
                this.oDialog.close();
            } else {
                MessageBox.alert(this.i18n("errorCreateProductMsg"));
            }
        },

        /**
         * "Confirm create product" button press event handler.
         * 
         * @public
         */
        onConfirmEditProduct: function() {
            var oView = this.getView(),
                aInputs = [
                    oView.byId("editProductNameInput"),
                    oView.byId("editProductPriceInput"),
                    oView.byId("editProductSpecsInput"),
                    oView.byId("editProductRatingInput"),
                    oView.byId("editProductSupplierInfoInput"),
                    oView.byId("editProductMadeInInput"),
                    oView.byId("editProductProdCompInput"),
                ],
                bValidationError = false;

            aInputs.forEach(function(oInput) {
                bValidationError = this._validateInput(oInput) || bValidationError;
            }, this);

            if (!bValidationError) {
                var oODataModel = this.getModel("odata");
                var message = this.i18n("successEditProductMsg");
                if (oODataModel.hasPendingChanges()) {
                    MessageBox.confirm(this.i18n("confirmEditProductMsg"), {
                        actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                        onClose: function(sAction) {
                            if (sAction === "OK") {
                                oODataModel.submitChanges();
                                oODataModel.refresh();
                                MessageToast.show(message);
                            }
                        }
                    });
                } else {
                    MessageToast.show(this.i18n("notEditProductMsg"));
                }
                this.pDialog.close();
            } else {
                MessageBox.alert(this.i18n("errorEditProductMsg"));
            }
        },

        /**
         * Event handler when a filter tab gets pressed
         * @param {sap.ui.base.Event} oEvent the filter tab event
         * 
         * @public
         */
        onQuickFilter: function(oEvent) {
            var oBinding = this._oTable.getBinding("items"),
                sKey = oEvent.getParameter("selectedKey");
            oBinding.filter(this._mFilters[sKey]);
        },

        /**
         * "Sort" button press event handler.
         * 
         * @param {sap.ui.base.Event} oEvent the filter tab event
         * @param  {string} sSortProperty the property of filter tab column
         */
        onSort: function(oEvent, sSortProperty) {
            var sSortType = this.oAppViewModel.getProperty("/sortType");
            var sProperty = this.oAppViewModel.getProperty("/sortProperty");
            var button = oEvent.getSource();
            var oItemsBinding = this._oTable.getBinding("items");

            if (sProperty != sSortProperty) {
                sSortType = SORT_NONE;
                this.oAppViewModel.setProperty("/sortProperty", sSortProperty);
                this.previousButton.setIcon("sap-icon://sort");
            }
            this.previousButton = button;
            switch (sSortType) {
                case SORT_NONE:
                    {
                        sSortType = SORT_ASC;
                        button.setIcon("sap-icon://sort-ascending");
                        var oSorter = new Sorter(sSortProperty, false);
                        oItemsBinding.sort(oSorter);
                        break;
                    }
                case SORT_ASC:
                    {
                        sSortType = SORT_DESC;
                        button.setIcon("sap-icon://sort-descending");
                        var oSorter = new Sorter(sSortProperty, true);
                        oItemsBinding.sort(oSorter);
                        break;
                    }
                case SORT_DESC:
                    {
                        sSortType = SORT_NONE;
                        button.setIcon("sap-icon://sort");
                        oItemsBinding.sort();
                        break;
                    }
            }
            this.oAppViewModel.setProperty("/sortType", sSortType);
        }
    });
});