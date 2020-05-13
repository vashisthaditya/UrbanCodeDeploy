/*
* Licensed Materials - Property of IBM* and/or HCL**
* UrbanCode Deploy
* (c) Copyright IBM Corporation 2011, 2017. All Rights Reserved.
* (c) Copyright HCL Technologies Ltd. 2018. All Rights Reserved.
*
* U.S. Government Users Restricted Rights - Use, duplication or disclosure restricted by
* GSA ADP Schedule Contract with IBM Corp.
*
* * Trademark of International Business Machines
* ** Trademark of HCL Technologies Limited
*/
/*global define: true */

define([
    "dojo/_base/declare",
    "dojo/Stateful"
], function (
    declare,
    Stateful
) {
    "use strict";

    /**
     * Generic data model based on dojo/Stateful to get and set properties.
     * The model can be serialzed through serialize() function or deserialized
     * from a json structure through deserialized(json) function.
     * One can optionally define a customized serializer and deserializer for
     * each property. See WizardModel.js for examples.
     */

    return declare([Stateful], {
        props: {},

        constructor: function (params) {
            this.props = params.props || this.props;
            this.initialize();
        },

        // load data from storage
        deserialize: function (data) {
            var deserializer = null, prop = null;
            this.initialize();

            for (prop in this.props) {
                if (this.props.hasOwnProperty(prop)) {
                    if (data[prop] !== undefined) {
                        deserializer = this[prop + 'Deserializer'];

                        if (typeof deserializer === 'function') {
                            deserializer.apply(this, [data[prop]]);
                        } else {
                            this.set(prop, data[prop]);
                        }
                    }
                }
            }
        },

        // collect data for storage
        serialize: function () {
            var data = {}, serializer = null, prop = null;

            for (prop in this.props) {
                if (this.props.hasOwnProperty(prop)) {
                    serializer = this[prop + 'Serializer'];

                    if (typeof serializer === 'function') {
                        data[prop] = serializer.apply(this, []);
                    } else {
                        data[prop] = this.get(prop);
                    }
                }
            }

            return data;
        },

        validate: function () {
            var errors = {}, ok = true, validator = null, prop = null;

            for (prop in this.props) {
                if (this.props.hasOwnProperty(prop)) {
                    try {
                        validator = this[prop + 'Validator'];

                        if (typeof validator === 'function') {
                            validator.apply(this, []);
                        }
                    } catch (e) {
                        errors[prop] = e.message;
                        ok = false;
                    }
                }
            }

            if (!ok) {
                throw {
                    errors: errors
                };
            }
        },

        initialize: function () {
            var prop = null;

            for (prop in this.props) {
                if (this.props.hasOwnProperty(prop)) {
                    this.set(prop, this.props[prop]);
                }
            }
        },

        getProps: function () {
            return this.props;
        }
    });
});
