"use client";

import { CKEditor } from "@ckeditor/ckeditor5-react";
import { useEffect, useState } from "react";
import {
  BlockQuote,
  Bold,
  ClassicEditor,
  Alignment,
  Essentials,
  Heading,
  Image as CKImage,
  ImageInsert,
  ImageUpload,
  ImageToolbar,
  Italic,
  Link,
  List,
  ImageStyle,
  Paragraph,
  Undo
} from "ckeditor5";
import "ckeditor5/ckeditor5.css";
import { getSupabase } from "@/lib/supabase";

class SupabaseUploadAdapter {
  loader:any;
  constructor(loader:any){this.loader=loader}
  async upload(){
    const file=await this.loader.file;
    const client=getSupabase();
    if(!client)throw new Error("Supabase is not configured.");
    const path=`${Date.now()}-${file.name.replace(/[^a-z0-9._-]+/gi,"-")}`;
    const {data,error}=await client.storage.from("site-media").upload(path,file,{upsert:false});
    if(error)throw error;
    const {data:url}=client.storage.from("site-media").getPublicUrl(data.path);
    return {default:url.publicUrl};
  }
  abort(){}
}

function uploadAdapterPlugin(editor:any){
  editor.plugins.get("FileRepository").createUploadAdapter=(loader:any)=>new SupabaseUploadAdapter(loader);
}

export default function CkEditorField({value,onChange}:{value:string;onChange:(value:string)=>void}){
  const [media,setMedia]=useState<{name:string;url:string}[]>([]);
  const [showMedia,setShowMedia]=useState(false);
  const [alignment,setAlignment]=useState<"left"|"right">("left");
  useEffect(()=>{
    const client=getSupabase();
    if(!client)return;
    client.storage.from("site-media").list("",{limit:100,sortBy:{column:"created_at",order:"desc"}}).then(({data})=>{
      if(!data)return;
      setMedia(data.filter(file=>Boolean(file.name)).map(file=>({name:file.name,url:client.storage.from("site-media").getPublicUrl(file.name).data.publicUrl})));
    });
  },[]);
  function insertMedia(url:string){
    const figure=`<figure class="image image-style-align-${alignment}"><img src="${url}" alt="" /></figure>`;
    onChange(`${value}${value.trim()?"<p></p>":""}${figure}`);
    setShowMedia(false);
  }
  return <div className="ckeditor-shell full">
    <div className="ckeditor-media-bar"><button type="button" className="ckeditor-media-toggle" onClick={()=>setShowMedia(open=>!open)}>Choose from media library</button><label>Image alignment<select value={alignment} onChange={event=>setAlignment(event.target.value as "left"|"right")}><option value="left">Left</option><option value="right">Right</option></select></label></div>
    {showMedia&&<div className="ckeditor-media-picker">{media.length?media.map(file=><button type="button" key={file.name} onClick={()=>insertMedia(file.url)} title={`Insert ${file.name}`}><img src={file.url} alt=""/><span>{file.name}</span></button>):<small>No uploaded images yet. Use Upload image in the editor toolbar first.</small>}</div>}
    <CKEditor
      editor={ClassicEditor}
      data={value}
      config={{
        licenseKey:"GPL",
        extraPlugins:[uploadAdapterPlugin],
        plugins:[Essentials,Paragraph,Heading,Bold,Italic,Link,List,BlockQuote,Undo,Alignment,CKImage,ImageToolbar,ImageStyle,ImageInsert,ImageUpload],
        toolbar:["undo","redo","|","heading","|","bold","italic","link","alignment","bulletedList","numberedList","blockQuote","|","uploadImage"],
        image:{styles:{options:["inline","block","side","alignLeft","alignCenter","alignRight"]},toolbar:["imageTextAlternative","imageStyle:inline","imageStyle:block","imageStyle:side","imageStyle:alignLeft","imageStyle:alignCenter","imageStyle:alignRight"]}
      }}
      onChange={(_,editor)=>onChange(editor.getData())}
    />
  </div>;
}
