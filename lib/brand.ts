export function practiceLogo(url: string) {
  return [
    "/assets/img/gastroarif.png",
    "/assets/img/gastroarif-mark.png",
  ].includes(url)
    ? "/assets/img/nk-hospital-logo.png"
    : url;
}
