const map = new maplibregl.Map({
    container: 'map',
    style: "https://raw.githubusercontent.com/gtitov/basemaps/refs/heads/master/positron-nolabels.json",
    center: [42, 55],
    zoom: 4
})

map.on("load", () => {
    const response = fetch("https://docs.google.com/spreadsheets/d/1f0waZduz5CXdNig_WWcJDWWntF-p5gN2-P-CNTLxEa0/export?format=csv")
    .then((response) => response.text())
    .then((csv) => {
        const rows = Papa.parse(csv, { header: true}) // подключили PapaParse, читаем csv
        // Формируем объекты GeoJson
        const geojsonFeatures = rows.data.map((row) => {
            return {
                type: "Feature",
                properties: row,
                geometry: {
                    type: "Point",
                    coordinates: [row.lon, row.lat]
                }
            }
        })
        const geojson = {
            type: "FeatureCollection",
            features: geojsonFeatures
        }

        // console.log(geojson)

        // список ВСЕХ вакансий
        geojson.features.map((f) => {
            document.getElementById(
                'list-all'
            ).innerHTML += `<div class = "list-item">
            <h4>${f.properties["Вакансия"]}</h4>
            <a href='#' onclick = "map.flyTo({center: [${f.geometry.coordinates}], zoom: 10})">Найти на карте</a>`
        })
    
        map.addSource("vacancies", {
            type: "geojson",
            data: geojson,
            cluster: true, // типа, сразу знаем, что точки придется кластеризовать
            clusterRadius: 20 // речь о радиусе поиска точек для объединения в кластер
        })

        map.addLayer({
            id: "clusters", 
            source: "vacancies", 
            type: "circle",
            paint: {
                "circle-color":" #FFFFFF",
                "circle-stroke-width": 5,
                // "circle-stroke-color":" #2E8B57",
                "circle-stroke-color": [
                    "step", ["get", "point_count"],
                    "#7DC59C",
                    3,
                    "#62C58D",
                    6,
                    "#2E8B56",
                ],
                "circle-radius": [
                    "step", ["get", "point_count"],
                    12,
                    3,
                    20,
                    6,
                    30,
                ]
            }
        })

        map.on('click', ['clusters'], (e) => {console.log(e.features)})

        map.addLayer({
            id: "cluster-labels",
            type: "symbol",
            source: "vacancies",
            layout: {
                "text-field": ['get', 'point_count'],
                // "text-size": 12
                "text-size": [
                    "step", ["get", "point_count"],
                    9,
                    3,
                    14,
                    6,
                    24
                ]
            }
        })

        // Сделайте, чтобы до первого перемещения карты список вакансий “Сейчас на карте” тоже был заполнен
        map.on('idle', () => {
            const features = map.queryRenderedFeatures({
                layers: ["clusters"]
            })

            document.getElementById("list-selected").innerHTML = "<h2>Сейчас на карте</h2>"

            features.map(f => {
                if(f.properties.cluster) {
                    const clusterId = f.properties.cluster_id;
                    const pointCount = f.properties.point_count;
                    map.getSource("vacancies").getClusterLeaves(clusterId, pointCount, 0)
                        .then((clusterFeatures) => {
                            clusterFeatures.map((feature) => document.getElementById("list_selected"
                                .innerHTML += `<div class="list-item">
                                <h4>${feature.properties["Вакансия"]}</h4>
                                <a target="blank_" href="${feature.properties["Ссылка на сайте Картетики"]}">Подробнее</a>
                                </div><hr>`)
                            )
                        })
                } else {
                    document.getElementById("list-selected")
                    .innerHTML += `<div class="list-item">
                    <h4>${f.properties["Вакансия"]}</h4>
                    <a target="blank_" href='${f.properties['Ссылка на сайте Картетики']}'>Подробнее</a>
                    </div><hr>`
                }
            })
        })


        map.on('moveend', () => {
            const features = map.queryRenderedFeatures({
                layers: ["clusters"]
            })

            document.getElementById("list-selected").innerHTML = "<h2>Сейчас на карте</h2>"

            features.map(f => {
                if(f.properties.cluster) {
                    const clusterId = f.properties.cluster_id;
                    const pointCount = f.properties.point_count;
                    map.getSource("vacancies").getClusterLeaves(clusterId, pointCount, 0)
                        .then((clusterFeatures) => {
                            clusterFeatures.map((feature) => document.getElementById("list_selected"
                                .innerHTML += `<div class="list-item">
                                <h4>${feature.properties["Вакансия"]}</h4>
                                <a target="blank_" href="${feature.properties["Ссылка на сайте Картетики"]}">Подробнее</a>
                                </div><hr>`)
                            )
                        })
                } else {
                    document.getElementById("list-selected")
                    .innerHTML += `<div class="list-item">
                    <h4>${f.properties["Вакансия"]}</h4>
                    <a target="blank_" href='${f.properties['Ссылка на сайте Картетики']}'>Подробнее</a>
                    </div><hr>`
                }
            })
        })




    })

    map.on('click', "clusters", function (e) {
        map.flyTo({center: e.lngLat, zoom: 8});
    })

    map.on('mouseenter', "clusters", function () {
        map.getCanvas().style.cursor = "pointer";
    })

    map.on('mouseleave', "clusters", function () {
        map.getCanvas().style.cursor = "";
    })

})