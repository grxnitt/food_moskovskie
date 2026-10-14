"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, LocateFixed, Minus, Plus, X, Footprints } from "lucide-react";
import { CENTER, type CatalogDish } from "@/lib/catalog";
import { rubles } from "@/lib/client";
declare global { interface Window { L: any; } }
let leafletPromise: Promise<any> | undefined;
function loadLeaflet() {
  if (!leafletPromise) leafletPromise = new Promise((resolve, reject) => {
    if (window.L) { resolve(window.L); return; }
    const link = document.createElement("link"); link.rel = "stylesheet"; link.href = "/vendor/leaflet.css"; document.head.appendChild(link);
    const script = document.createElement("script"); script.src = "/vendor/leaflet.js"; script.onload = () => resolve(window.L); script.onerror = reject; document.head.appendChild(script);
  });
  return leafletPromise;
}
export default function MapView({ items, onOpen }: { items: CatalogDish[]; onOpen: (d: CatalogDish) => void }) {
  const host = useRef<HTMLDivElement>(null); const map = useRef<any>(null); const layer = useRef<any>(null);
  const [selected, setSelected] = useState<CatalogDish | null>(null); const [error, setError] = useState(false);
  const itemsRef = useRef(items); itemsRef.current = items;
  function renderPins(L: any) {
    if (!layer.current || !map.current) return; layer.current.clearLayers();
    itemsRef.current.filter((d, i, a) => a.findIndex(other => other.address === d.address) === i).forEach((d, i) => {
      const marker = L.marker(d.coordinates, { icon: L.divIcon({ className: "food-marker", html: `<div class="food-pin pin-${i}"><img src="${d.image}" alt=""/><span>${rubles(d.price)}</span></div><i class="pin-dot"></i>`, iconSize: [96, 112], iconAnchor: [48, 112] }), keyboard: true, title: `${d.venue}, ${d.address}, ${d.name}`, zIndexOffset: 400 }).addTo(layer.current);
      marker.on("click", () => { setSelected(d); map.current.panTo(d.coordinates, { animate: true }); });
    });
    if (itemsRef.current.length && map.current) map.current.fitBounds(L.latLngBounds(itemsRef.current.map(d => d.coordinates)), { paddingTopLeft: [70, 135], paddingBottomRight: [70, 90], maxZoom: 14.25 });
  }
  useEffect(() => {
    let disposed = false;
    loadLeaflet().then(L => {
      if (disposed || !host.current) return;
      map.current = L.map(host.current, { zoomControl: false, scrollWheelZoom: false, zoomSnap: 0.25 }).setView([59.8905, 30.321], 14.25);
      const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>', maxZoom: 19 }).addTo(map.current);
      tiles.on("tileerror", () => setError(true)); tiles.on("load", () => setError(false));
      L.circle(CENTER, { radius: 2000, color: "#96ae53", weight: 2, dashArray: "7 8", fillColor: "#d1f267", fillOpacity: 0.07, interactive: false }).addTo(map.current);
      L.marker(CENTER, { icon: L.divIcon({ html: '<div class="metro-pin">м</div><span class="metro-name">Московские<br/>ворота</span>', className: "metro-marker", iconSize: [120, 85], iconAnchor: [60, 25] }), interactive: false, keyboard: false, zIndexOffset: 200 }).addTo(map.current);
      layer.current = L.layerGroup().addTo(map.current);
      const observer = new ResizeObserver(() => { map.current?.invalidateSize(); if (map.current && itemsRef.current.length) map.current.fitBounds(L.latLngBounds(itemsRef.current.map(d => d.coordinates)), { paddingTopLeft: [70, 135], paddingBottomRight: [70, 90], maxZoom: 14.25 }); }); observer.observe(host.current); map.current._resizeObserver = observer;
      renderPins(L);
    }).catch(() => setError(true));
    return () => { disposed = true; if (map.current) { map.current._resizeObserver?.disconnect(); map.current.remove(); map.current = null; layer.current = null; } };
  }, []);
  useEffect(() => { if (window.L && layer.current) renderPins(window.L); setSelected(null); }, [items]);
  return <div className="map-wrap" id="map"><div ref={host} className="map-canvas" aria-label="Карта еды в радиусе двух километров от Московских ворот" /><div className="map-top"><span className="location-pill"><span className="metro-symbol">м</span> м. Московские ворота</span><button className="radius-button" title="Показать весь радиус поиска" onClick={() => { if (map.current) map.current.fitBounds(window.L.circle(CENTER, { radius: 2000 }).getBounds(), { padding: [20, 40] }); }}>2 км <ArrowUpRight size={15} /></button></div><div className="map-controls"><div><button aria-label="Приблизить карту" onClick={() => map.current?.zoomIn()}><Plus size={20} /></button><button aria-label="Отдалить карту" onClick={() => map.current?.zoomOut()}><Minus size={20} /></button></div><button className="locate-button" aria-label="Вернуться к Московским воротам" onClick={() => map.current?.setView([59.8905, 30.321], 14.25)}><LocateFixed size={20} /></button></div><div className="map-caption">Твой обед где-то здесь <ArrowUpRight size={16} /></div>{selected && <div className="map-preview"><img src={selected.image} alt="" /><button className="map-preview-copy" onClick={() => onOpen(selected)}><strong>{selected.name}</strong><span>{selected.venue} · {rubles(selected.price)}</span><small><Footprints size={13} /> ≈ {selected.walkMinutes} мин от метро</small></button><button className="icon-button" onClick={() => onOpen(selected)} aria-label="Открыть блюдо"><ArrowUpRight size={20} /></button><button className="preview-close" onClick={() => setSelected(null)} aria-label="Закрыть карточку на карте"><X size={14} /></button></div>}{error && <p className="map-error">Не загрузилась подложка карты. Адреса доступны в карточках.</p>}</div>;
}
