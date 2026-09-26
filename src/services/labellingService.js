/*
    Guide 4.2: labelling screen API.

    GET  /api/labelling/next/    next filing for this labeller (blind)
    POST /api/labelling/labels/  save one label
*/

import api from "../api/axios";


export async function getNextLabellingItem() {
    const response = await api.get("/labelling/next/");
    return response.data;
}


export async function submitLabel(label) {
    const response = await api.post("/labelling/labels/", label);
    return response.data;
}
