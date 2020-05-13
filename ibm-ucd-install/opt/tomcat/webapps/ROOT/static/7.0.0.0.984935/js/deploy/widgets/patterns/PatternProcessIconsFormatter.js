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
/*global i18n, define, formatters */

define(["dojo/_base/array",
        "dojo/dom-construct",
        "dojo/dom-class",
        "dojo/dom-style",
        "dojo/mouse",
        "dojo/on",
        "dijit/form/Button",
        "dijit/TooltipDialog",
        "dijit/popup",
        "deploy/widgets/tag/TagDisplay",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/table/TreeTable"
        ],
function(array,
        domConstruct,
        domClass,
        domStyle,
        mouse,
        on,
        Button,
        TooltipDialog,
        popup,
        TagDisplay,
        Dialog,
        TreeTable) {
    return {

        /**
         *
         */
        getIconForTree: function(item) {
            var icon = "process-icon ";
            if (item.type){
                if (item.type === "folder"){
                    icon += "process-folder-icon";
                }
                else {
                    icon += item.type + "-step-icon";
                }
            }
            else {
                icon += this.getIconForStep(item) + "-step-icon";
            }
            return domConstruct.create("div", {
                className: "inline-block " + icon
            });

        },

        getIconForStep: function(item, fromName) {
            var image = "patternResourceDefault";
            var resourceType = item.activity.resourceType;
            if (resourceType){
                if (resourceType === "OS::Neutron::Port"){
                    image = "port";
                } else if (resourceType === "IBM::UrbanCode::ResourceTree"){
                    image = "resourceTree";
                } else if (resourceType === "IBM::UrbanCode::SoftwareConfig::UCD"){
                    image = "swConfig";
                } else if (resourceType === "IBM::UrbanCode::SoftwareDeploy::UCD"){
                    image = "swDeploy";
                } else if (resourceType === "OS::Heat::MultipartMime"){
                    image = "mime";
                } else if (resourceType === "OS::Heat::SoftwareConfig") {
                    image = "swConfig";
                } else if (resourceType === "OS::Neutron::SecurityGroup") {
                    image = "securityGroup";
                } else if (resourceType === "OS::Cinder::Volume") {
                    image = "volume";
                } else if (resourceType === "OS::Cinder::VolumeAttachment") {
                    image = "volumeAttachment";
                } else if (resourceType === "server") {
                    image = "server";
                } else if (resourceType === "configurationResourceGroup") {
                    image = "configuration";
                } else if (resourceType === "serverResourceGroup") {
                    image = "server";
                } else if (resourceType === "OS::Neutron::Router") {
                    image = "router";
                } else if (resourceType === "OS::Swift::Container") {
                    image = "volumeBlob";
                } else if (resourceType === "OS::Neutron::LoadBalancer") {
                    image = "loadbalancer";
                } else if (resourceType === "OS::Neutron::HealthMonitor") {
                    image = "monitor";
                } else if (resourceType === "OS::Neutron::Pool") {
                    image = "replicationGroup";
                } else if (resourceType === "OS::Neutron::FloatingIP") {
                    image = "elasticIp";
                } else if (resourceType === "OS::Neutron::Net") {
                    image = "network";
                } else if (resourceType === "OS::Heat::AutoScalingGroup") {
                    image = "scalingGroup";
                } else if (resourceType === "OS::Heat::ScalingPolicy") {
                    image = "scalingPolicy";
                } else if (resourceType === "OS::Neutron::Net") {
                    image = "network";
                } else if (resourceType === "IBM::ElastiCache::ReplicationGroup") {
                    image = "scalingPolicy";
                } else if (resourceType === "IBM::RDS::Instance") {
                    image = "rdsInstance";
                } else if (resourceType === "IBM::ElastiCache::Cluster") {
                    image = "elasticCache";
                } else if (resourceType.endsWith(".yaml") || resourceType.endsWith(".yml")) {
                    image = "blueprint";
                } else if (resourceType === "OS::Ceilometer::Alarm") {
                    image = "alarm";
                }
            }
            return image;
        }
    };
});
