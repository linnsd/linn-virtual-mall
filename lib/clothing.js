// The bundled guest rigs use one atlas for skin, hair and clothing. Bind-pose
// masks move with the skinned vertices; the fabric filter preserves skin details.
export function clothingRegion(height, bone, sex) {
  if (/Head|head|neck|Hand|Foot|Toe/.test(bone)) return [0, 0];
  if (/Arm|Shoulder/.test(bone)) return [1, 0];
  if (height > (sex === 'f' ? .635 : .555) && height < .845) return [1, 0];
  if (height > (sex === 'f' ? .30 : .10) && height < (sex === 'f' ? .635 : .535)) return [0, 1];
  return [0, 0];
}
export function clothingColors(colors = {}) {
  const valid = v => Number.isInteger(v) && v >= 0 && v <= 0xffffff;
  return Object.fromEntries(['topColor', 'bottomColor'].filter(k => valid(colors[k])).map(k => [k, colors[k]]));
}
const masks = new WeakMap();
export function dressAvatar(THREE, model, sex, colors) {
  const materials = [], uniforms = {
    mallTop: {value: new THREE.Color()}, mallBottom: {value: new THREE.Color()},
    mallClothesOn: {value: new THREE.Vector2()}
  };
  model.traverse(mesh => {
    if (!mesh.isSkinnedMesh) return;
    const source = mesh.geometry;
    let geometry = masks.get(source);
    if (!geometry) {
      geometry = source.clone();
      const pos = source.attributes.position, joints = source.attributes.skinIndex, weights = source.attributes.skinWeight;
      let low = Infinity, high = -Infinity;
      for (let i=0;i<pos.count;i++) { low=Math.min(low,pos.getY(i)); high=Math.max(high,pos.getY(i)); }
      const mask = new Float32Array(pos.count*2), getters=['getX','getY','getZ','getW'];
      for (let i=0;i<pos.count;i++) {
        let dominant=0, weight=-1;
        for (let j=0;j<4;j++) { const w=weights[getters[j]](i); if(w>weight){weight=w;dominant=j;} }
        const bone=mesh.skeleton.bones[joints[getters[dominant]](i)]?.name || '';
        mask.set(clothingRegion((pos.getY(i)-low)/(high-low||1),bone,sex),i*2);
      }
      geometry.setAttribute('mallClothMask',new THREE.BufferAttribute(mask,2));
      masks.set(source,geometry);
    }
    mesh.geometry=geometry;
    const tint = original => {
      const material=original.clone(); materials.push(material);
      material.customProgramCacheKey=()=> 'mall-clothes-v1';
      material.onBeforeCompile=shader=>{
        Object.assign(shader.uniforms,uniforms);
        shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute vec2 mallClothMask;\nvarying vec2 vMallCloth;')
          .replace('#include <begin_vertex>','#include <begin_vertex>\nvMallCloth = mallClothMask;');
        shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
          varying vec2 vMallCloth;
          uniform vec3 mallTop;
          uniform vec3 mallBottom;
          uniform vec2 mallClothesOn;`)
          .replace('#include <map_fragment>',`#include <map_fragment>
          float fabricMax = max(diffuseColor.r,max(diffuseColor.g,diffuseColor.b));
          float fabricMin = min(diffuseColor.r,min(diffuseColor.g,diffuseColor.b));
          float neutral = 1.0-smoothstep(0.12,0.25,(fabricMax-fabricMin)/max(fabricMax,0.001));
          float lightness = dot(diffuseColor.rgb,vec3(0.299,0.587,0.114));
          float shirt = vMallCloth.x * mallClothesOn.x * neutral * smoothstep(0.12,0.30,lightness);
          float trousers = vMallCloth.y * mallClothesOn.y * neutral * (1.0-smoothstep(0.35,0.55,fabricMax));
          diffuseColor.rgb = mix(diffuseColor.rgb,mallTop*lightness,shirt);
          diffuseColor.rgb = mix(diffuseColor.rgb,mallBottom*(0.40+0.60*sqrt(clamp(lightness*3.0,0.0,1.0))),trousers);`);
      };
      return material;
    };
    mesh.material=Array.isArray(mesh.material)?mesh.material.map(tint):tint(mesh.material);
  });
  const controller={
    setColors(value) {
      const c=clothingColors(value);
      uniforms.mallClothesOn.value.set(c.topColor===undefined?0:1,c.bottomColor===undefined?0:1);
      uniforms.mallTop.value.setHex(c.topColor??0xffffff);
      uniforms.mallBottom.value.setHex(c.bottomColor??0xffffff);
    },
    dispose(){ for(const material of materials) material.dispose(); }
  };
  controller.setColors(colors);
  return controller;
}
