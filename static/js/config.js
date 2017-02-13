        var ms_ie = false;
        var ua = window.navigator.userAgent;
        var old_ie = ua.indexOf('MSIE ');
        var new_ie = ua.indexOf('Trident/');
    
        if ((old_ie > -1) || (new_ie > -1)) {
            ms_ie = true;
        }
        if (ms_ie) {
            $("#iealert").addClass("alert alert-warning");
            $("#iealert").html("You may encounter issues with Internet Explorer, please consider using the BIBFRAME Editor with Firefox.")
        }
        function myCB(data) {
            document.body.scrollTop = document.documentElement.scrollTop = 0;
        }

        function csrfSafeMethod(method) {
        // these HTTP methods do not require CSRF protection
            return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
        }
        
        function save(data, csrf){

            $.ajaxSetup({
               beforeSend: function(xhr, settings) {
                     if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                         xhr.setRequestHeader("X-CSRFToken", csrf);
                     }
                 }
            });
            $.post("/tools/bibframe/save",{
                json: JSON.stringify(data),
                csrf: csrf
                }).done(function (data) {
                $.ajaxSetup({
                   beforeSend: function(xhr, settings) {
                         if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                             xhr.setRequestHeader("X-CSRFToken", csrf);
                         }                                
                     }                    
                });
                 $.ajax({
                   url: "/api/",
                   type: "POST",
                   data:JSON.stringify(data),
                   csrf: csrf,
                   dataType: "json",
                   contentType: "application/json; charset=utf-8"
                 }).done(function (data) {
                    document.body.scrollTop = document.documentElement.scrollTop = 0;
                    console.log("success");
                 }).fail(function (data){
                    console.log(data.responseText);
                 }).always(function(){                       
                    $("#bfeditor > .row").remove();
                    $("#bfeditor > .footer").remove();
                    bfeditor = bfe.fulleditor(config, "bfeditor");
                    var $messagediv = $('<div>', {id: "bfeditor-messagediv"});
                    $messagediv.append('<span class="str"><h3>Record Created</h3><a href='+data.url+'>'+data.name+'</a></span>');
                    $('#bfeditor-formdiv').append($messagediv);
                 });
            }).fail(function(data){
                    var $messagediv = $('<div>', {id: "bfeditor-messagediv"});
                    $messagediv.append('<span class="str"><h3>Save Failed</h3>'+data.responseText+'</span>');
                    $('#bfeditor-formdiv').prepend($messagediv);
            });
        }

        var config = {
            "baseURI": "http://bibframe.org/",
            "profiles": [
                "/static/bfe/static/profiles/bibframe/BIBFRAME Agents.json",
                "/static/bfe/static/profiles/bibframe/BIBFRAME Annotations.json",
                "/static/bfe/static/profiles/bibframe/BIBFRAME Authorities.json",
                "/static/bfe/static/profiles/bibframe/BIBFRAME AgentsMono.json",
                "/static/bfe/static/profiles/bibframe/BIBFRAME Entities.json",
                "/static/bfe/static/profiles/bibframe/WEI-monograph.json",
                "/static/bfe/static/profiles/bibframe/WEI-notated-music.json",
                "/static/bfe/static/profiles/bibframe/WEI-serial.json",
                "/static/bfe/static/profiles/bibframe/WEI-cartographic.json",
                "/static/bfe/static/profiles/bibframe/WEI-BluRayDVD.json",
                "/static/bfe/static/profiles/bibframe/WEI-Audio\ CD.json",
                "/static/bfe/static/profiles/bibframe/WEI-35mmFeatureFilm.json",
                "/static/bfe/static/profiles/bibframe/Prints\ and \Photographs.json"
            ],
            "startingPoints": [
                        {"menuGroup": "Monograph",
                        "menuItems": [
                            {
                                label: "Instance", 
                                useResourceTemplates: [ "profile:bf:Instance:Monograph" ]
                            },
                            {
                                label: "Work", 
                                useResourceTemplates: [ "profile:bf:Work:Monograph", "profile:bf:RDAExpression:Monograph" ]
                            },
                            {
                                label: "Work, Instance", 
                                useResourceTemplates: [ "profile:bf:Work:Monograph", "profile:bf:RDAExpression:Monograph", "profile:bf:Instance:Monograph" ]
                            }
                        ]},
                        {"menuGroup": "Notated Music",
                        "menuItems": [
                            {
                                label: "Instance",
                                useResourceTemplates: [ "profile:bf:Instance:NotatedMusic" ]
                            },
                            {
                                label: "Work",
                                useResourceTemplates: [ "profile:bf:Work:NotatedMusic", "profile:bf:RDAExpression:NotatedMusic" ]
                            },
                            {
                                label: "Work, Instance",
                                useResourceTemplates: [ "profile:bf:Work:NotatedMusic", "profile:bf:RDAExpression:NotatedMusic", "profile:bf:Instance:NotatedMusic" ]
                            }
                        ]},
                        {"menuGroup": "Serial",
                        "menuItems": [
                            {
                                label: "Instance",
                                useResourceTemplates: [ "profile:bf:Instance:Serial" ]
                            },
                            {
                                label: "Work",
                                useResourceTemplates: [ "profile:bf:Work:Serial", "profile:bf:RDAExpression:Serial" ]
                            },
                            {
                                label: "Work, Instance",
                                useResourceTemplates: [ "profile:bf:Work:Serial", "profile:bf:RDAExpression:Serial", "profile:bf:Instance:Serial" ]
                            }
                        ]},
                        {"menuGroup": "Cartographic",
                        "menuItems": [
                            {
                                label: "Instance",
                                useResourceTemplates: [ "profile:bf:Instance:Cartography" ]
                            },
                            {
                                label: "Work",
                                useResourceTemplates: [ "profile:bf:Work:Cartography", "profile:bf:RDAExpression:Cartography" ]
                            },
                            {
                                label: "Work, Instance",
                                useResourceTemplates: [ "profile:bf:Work:Cartography", "profile:bf:RDAExpression:Cartography", "profile:bf:Instance:Cartography" ]
                            }
                        ]},
                        {"menuGroup": "BluRay DVD",
                        "menuItems": [
                            {
                                label: "Instance",
                                useResourceTemplates: [ "profile:bf:Instance:BluRayDVD" ]
                            },
                            {
                                label: "Work",
                                useResourceTemplates: [ "profile:bf:Work:BluRayDVD", "profile:bf:RDAExpression:BluRayDVD" ]
                            },
                            {
                                label: "Work, Instance",
                                useResourceTemplates: [ "profile:bf:Work:BluRayDVD", "profile:bf:RDAExpression:BluRayDVD", "profile:bf:Instance:BluRayDVD" ]
                            }
                        ]},
                        {"menuGroup": "35mm Feature Film",
                        "menuItems": [
                            {
                                label: "Instance",
                                useResourceTemplates: [ "profile:bf:Instance:35mmFeatureFilm" ]
                            },
                            {
                                label: "Work",
                                useResourceTemplates: [ "profile:bf:Work:35mmFeatureFilm", "profile:bf:RDAExpression:35mmFeatureFilm" ]
                            },
                            {
                                label: "Work, Instance",
                                useResourceTemplates: [ "profile:bf:Work:35mmFeatureFilm", "profile:bf:RDAExpression:35mmFeatureFilm", "profile:bf:Instance:35mmFeatureFilm" ]
                            }
                        ]},

                        {"menuGroup": "Audio CD",
                        "menuItems": [
                            {
                                label: "Instance",
                                useResourceTemplates: [ "profile:bf:Instance:AudioCD" ]
                            },
                            {
                                label: "Work",
                                useResourceTemplates: [ "profile:bf:Work:AudioCD", "profile:bf:RDAExpression:AudioCD" ]
                            },
                            {
                                label: "Work, Instance",
                                useResourceTemplates: [ "profile:bf:Work:AudioCD", "profile:bf:RDAExpression:AudioCD", "profile:bf:Instance:AudioCD" ]
                            }
                        ]},

                        {"menuGroup": "Prints and Photographs",
                        "menuItems": [
                            {
                                label: "Single Photograph",
                                useResourceTemplates: [ "profile:bf:Graphics:Photograph" ]
                            }
                        ]}


            ],
            "save": {
                "callback": save
            },
            "return": {
                "format": "jsonld-expanded",
                "callback": myCB
            }
        }
        var bfeditor = bfe.fulleditor(config, "bfeditor");
