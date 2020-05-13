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
/*global define */
define([
        "dojo/_base/declare",
        "dojo/_base/array"
        ],
function(
        declare,
        array
) {
    return declare(null,
        {
            /**
             *
             */
            sort: function(rowObjects, level) {
                var self = this;
                var i;
                if (!level) {
                    level = 0;
                }
                var orderField = self.orderField;
                if (self.orderField instanceof Array && self.orderField.length > level) {
                    orderField = self.orderField[level];
                }

                // Sort the data, if necessary.
                if (orderField !== undefined) {
                    array.forEach(self.columns, function(column) {
                        var rawValueDefined = !!column.getRawValue;
                        if (column.orderField !== undefined && column.orderField === orderField) {
                            rowObjects.sort(function(first, second) {
                                var firstValue = null;
                                var secondValue = null;
                                if (rawValueDefined) {
                                    firstValue = column.getRawValue(first.item);
                                    secondValue = column.getRawValue(second.item);
                                }
                                else {
                                    firstValue = first.item[column.orderField];
                                    secondValue = second.item[column.orderField];
                                }

                                var hasFirstValue = true;
                                var hasSecondValue = true;

                                if (firstValue === null || firstValue === undefined) {
                                    hasFirstValue = false;
                                }
                                if (secondValue === null || secondValue === undefined) {
                                    hasSecondValue = false;
                                }

                                var result = 0;
                                if (!hasFirstValue || !hasSecondValue) {
                                    if (!hasFirstValue && !hasSecondValue) {
                                        result = 0;
                                    }
                                    else if (hasFirstValue) {
                                        result = 1;
                                    }
                                    else if (hasSecondValue) {
                                        result = -1;
                                    }
                                }
                                else {
                                    var type = typeof firstValue;
                                    if (type === "number") {
                                        result = firstValue - secondValue;
                                    }
                                    else if (type === "string") {
                                        result = firstValue.localeCompare(secondValue);
                                    }
                                    else if (type === "object") {
                                        if (firstValue instanceof Date) {
                                            result = firstValue - secondValue;
                                        }
                                    }
                                }

                                if (self.sortType === "desc") {
                                    result = result*(-1);
                                }

                                return result;
                            });
                        }
                    });
                }

                array.forEach(rowObjects, function(rowObject) {
                    if (!!rowObject.children && rowObject.children.length > 0) {
                        self.sort(rowObject.children, level+1);
                    }
                });

                return rowObjects;
            }
        }
    );
});
