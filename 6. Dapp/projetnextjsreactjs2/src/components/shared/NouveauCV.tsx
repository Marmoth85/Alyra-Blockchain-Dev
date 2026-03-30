import BasDuCV from "./BasDuCV"

const NouveauCV = ({ title }: { title: string }) => {
  return (
    <>
        <h1>{title}</h1>
        <div>Contenu du CV</div>
        <BasDuCV />
    </>
  )
}

export default NouveauCV