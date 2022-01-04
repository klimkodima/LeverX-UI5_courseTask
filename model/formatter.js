sap.ui.define([], function() {
    "use strict";
    return {

        /**
         * Formatted the telephone number unit value
         * @public
         * @param {string} tel the telephone number string to be formatted
         * @returns {string}  short formatted telephone number 
         */
        correctTel: function(tel) {
            return new String(tel).replace(/\./gi, "-").substr(0, 18);
        },

        /**
         * Formatted the date unit value to short date
         * @public
         * @param {string} date the date string to be formatted
         * @returns {string}  short formatted date 
         */
        correctDate: function(date) {
            var newDate = new Date(date);
            let options = { month: "short", day: "numeric", year: "numeric" };
            return new Intl.DateTimeFormat("en-En", options).format(newDate);
        },

        /**
         * Change the technical status from the data model to a human - readable text
         * @public
         * @param {string} sStatus the technical status from the data model
         * @returns {string}  human - readable text 
         */
        statusText: function(sStatus) {
            var resourceBundle = this.getResourceBundle();
            switch (sStatus) {
                case "OK":
                    return resourceBundle.getText("okStatus");
                case "STORAGE":
                    return resourceBundle.getText("storageStatus");
                case "OUT_OF_STOCK":
                    return resourceBundle.getText("outOfStockStatus");
            }
        }
    };
});