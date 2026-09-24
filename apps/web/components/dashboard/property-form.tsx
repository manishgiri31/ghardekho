"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { propertyCreateSchema, propertyUpdateSchema } from "@ghardekho/validation";
import type { PropertyRecord } from "@ghardekho/types";
import { createProperty, updateProperty } from "@/lib/api/properties";
import { ApiError } from "@/lib/api/client";

type Values = Record<string, string>;
const initialValues = (property?: PropertyRecord): Values => ({
  title: property?.title ?? "", description: property?.description ?? "", propertyType: property?.propertyType ?? "APARTMENT", listingType: property?.listingType ?? "SALE",
  price: property?.price ?? "", area: property?.area ?? "", areaUnit: property?.areaUnit ?? "SQFT", bedrooms: property?.bedrooms?.toString() ?? "", bathrooms: property?.bathrooms?.toString() ?? "", balconies: property?.balconies?.toString() ?? "",
  furnishing: property?.furnishing ?? "", possessionStatus: property?.possessionStatus ?? "", floorNumber: property?.floorNumber?.toString() ?? "", totalFloors: property?.totalFloors?.toString() ?? "",
  address: property?.address ?? "", locality: property?.locality ?? "", city: property?.city ?? "", state: property?.state ?? "", pincode: property?.pincode ?? "", latitude: property?.latitude ?? "", longitude: property?.longitude ?? "",
});
const optionalNumber = (value: string) => value === "" ? undefined : Number(value);

export function PropertyForm({ mode, property }: { mode: "create" | "edit"; property?: PropertyRecord }) {
  const router = useRouter(); const [values,setValues] = useState<Values>(()=>initialValues(property)); const [errors,setErrors] = useState<Record<string,string>>({}); const [serverError,setServerError] = useState(""); const [busy,setBusy] = useState(false);
  function field(name:string) { return { value: values[name] ?? "", onChange: (event: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>)=>setValues((current)=>({...current,[name]:event.target.value})) }; }
  function input(name:string,label:string,opts: {type?:string; required?:boolean; step?:string; min?:string; max?:string; placeholder?:string; inputMode?:"numeric"|"decimal"|"text"}={}) { return <label className="grid gap-2 text-sm font-semibold text-ink">{label}<input {...field(name)} name={name} type={opts.type??"text"} required={opts.required} step={opts.step} min={opts.min} max={opts.max} placeholder={opts.placeholder} inputMode={opts.inputMode} className="h-12 min-w-0 border border-line px-3 font-normal outline-none focus:border-forest" aria-invalid={Boolean(errors[name])}/>{errors[name]&&<span className="text-xs font-normal text-red-700">{errors[name]}</span>}</label>; }
  function select(name:string,label:string,options:[string,string][]) { return <label className="grid gap-2 text-sm font-semibold text-ink">{label}<select {...field(name)} name={name} className="h-12 border border-line bg-white px-3 font-normal">{options.map(([value,text])=><option key={value} value={value}>{text}</option>)}</select>{errors[name]&&<span className="text-xs font-normal text-red-700">{errors[name]}</span>}</label>; }
  function textArea(name:string,label:string,required:boolean,minLength:number,maxLength:number) { return <label className="grid gap-2 text-sm font-semibold text-ink">{label}<textarea {...field(name)} name={name} required={required} minLength={minLength} maxLength={maxLength} rows={5} className="border border-line p-3 font-normal leading-6 outline-none focus:border-forest"/>{errors[name]&&<span className="text-xs font-normal text-red-700">{errors[name]}</span>}</label>; }
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); setErrors({}); setServerError(""); setBusy(true);
    const form = new FormData(event.currentTarget);
    const payload = {
      title: form.get("title"), description: form.get("description"), propertyType: form.get("propertyType"), listingType: form.get("listingType"),
      price: Number(form.get("price")), area: Number(form.get("area")), areaUnit: form.get("areaUnit"),
      bedrooms: optionalNumber(String(form.get("bedrooms"))), bathrooms: optionalNumber(String(form.get("bathrooms"))), balconies: optionalNumber(String(form.get("balconies"))),
      floorNumber: optionalNumber(String(form.get("floorNumber"))), totalFloors: optionalNumber(String(form.get("totalFloors"))),
      furnishing: form.get("furnishing") || undefined, possessionStatus: form.get("possessionStatus") || undefined,
      address: form.get("address"), locality: form.get("locality"), city: form.get("city"), state: form.get("state"), pincode: form.get("pincode"),
      latitude: optionalNumber(String(form.get("latitude"))), longitude: optionalNumber(String(form.get("longitude"))),
    };
    const showIssues = (issues: { path: PropertyKey[]; message: string }[]) => { const next:Record<string,string>={}; for(const issue of issues) { const key=String(issue.path[0]??"form"); next[key]??=issue.message; } setErrors(next); setServerError("Review the highlighted fields and try again."); };
    try {
      let result;
      if (mode === "create") {
        const parsed = propertyCreateSchema.safeParse(payload);
        if (!parsed.success) { showIssues(parsed.error.issues); setBusy(false); return; }
        result = await createProperty(parsed.data);
      } else {
        const parsed = propertyUpdateSchema.safeParse(payload);
        if (!parsed.success) { showIssues(parsed.error.issues); setBusy(false); return; }
        result = await updateProperty(property!.id, parsed.data);
      }
      const record = result.data;
      router.push(`/properties/${encodeURIComponent(record.slug || record.id)}`); router.refresh();
    } catch (cause) { setServerError(cause instanceof ApiError ? cause.message : "We couldn’t save this listing. Please try again."); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="space-y-7">
    <section className="border border-line bg-white p-5 sm:p-7"><p className="eyebrow">01 · The essentials</p><h2 className="mt-2 text-lg font-semibold">Basic information</h2><div className="mt-5 grid gap-5">{input("title","Listing title",{required:true,max:"160",placeholder:"A bright apartment near the park"})}{textArea("description","Description",true,30,10000)}<div className="grid gap-5 sm:grid-cols-2">{select("propertyType","Property type",[["APARTMENT","Apartment"],["HOUSE","House"],["VILLA","Villa"],["PLOT","Plot"],["COMMERCIAL","Commercial"],["OFFICE","Office"],["SHOP","Shop"],["WAREHOUSE","Warehouse"],["OTHER","Other"]])}{select("listingType","Listing type",[["SALE","For sale"],["RENT","For rent"]])}</div></div></section>
    <section className="border border-line bg-white p-5 sm:p-7"><p className="eyebrow">02 · The address</p><h2 className="mt-2 text-lg font-semibold">Location</h2><div className="mt-5 grid gap-5 sm:grid-cols-2">{input("address","Street address",{required:true,max:"240"})}{input("locality","Locality / neighbourhood",{required:true,max:"120"})}{input("city","City",{required:true,max:"100"})}{input("state","State",{required:true,max:"100"})}{input("pincode","PIN code",{required:true,inputMode:"numeric"})}{input("latitude","Latitude (optional)",{type:"number",step:"any",min:"-90",max:"90"})}{input("longitude","Longitude (optional)",{type:"number",step:"any",min:"-180",max:"180"})}</div></section>
    <section className="border border-line bg-white p-5 sm:p-7"><p className="eyebrow">03 · The details</p><h2 className="mt-2 text-lg font-semibold">Property details</h2><div className="mt-5 grid gap-5 sm:grid-cols-2">{input("price","Price (₹)",{type:"number",required:true,step:"any",min:"0.01"})}{input("area","Built-up area",{type:"number",required:true,step:"any",min:"0.01"})}{select("areaUnit","Area unit",[["SQFT","Square feet"],["SQM","Square metres"],["ACRE","Acres"]])}{input("bedrooms","Bedrooms",{type:"number",min:"0",max:"30",step:"1"})}{input("bathrooms","Bathrooms",{type:"number",min:"0",max:"30",step:"1"})}{input("balconies","Balconies",{type:"number",min:"0",max:"30",step:"1"})}{input("floorNumber","Floor",{type:"number",min:"-5",max:"300",step:"1"})}{input("totalFloors","Total floors",{type:"number",min:"0",max:"300",step:"1"})}{select("furnishing","Furnishing",[["","Not specified"],["UNFURNISHED","Unfurnished"],["SEMI_FURNISHED","Semi-furnished"],["FURNISHED","Furnished"]])}{select("possessionStatus","Possession",[["","Not specified"],["READY_TO_MOVE","Ready to move"],["UNDER_CONSTRUCTION","Under construction"],["NEW_LAUNCH","New launch"]])}</div></section>
    <section className="border border-line bg-paper p-5 sm:p-7"><p className="eyebrow">04 · More to come</p><h2 className="mt-2 text-lg font-semibold">Amenities and photos</h2><p className="mt-3 text-sm leading-6 text-muted">The API accepts amenity IDs but does not provide an amenity catalogue. Media storage and upload are not implemented. Nothing will be uploaded or attached from this form.</p></section>
    {mode === "edit" && property?.status === "PUBLISHED" && <p className="border-l-2 border-gold bg-white px-4 py-3 text-sm leading-6 text-muted">Saving changes to a published listing returns it to pending review, as required by the current API workflow.</p>}
    {serverError&&<p role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{serverError}</p>}
    <button disabled={busy} className="h-12 w-full bg-forest px-6 text-sm font-semibold text-white disabled:opacity-50 sm:w-auto">{busy?"Saving listing…":mode === "create" ? "Submit property" : "Save changes"}</button>
  </form>;
}
