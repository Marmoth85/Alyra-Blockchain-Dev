import ConnectButton from "./ConnectButton"

const Header = () => {
  return (
    <div className="flex items-center justify-between p-5">
        <div>Logo</div>
        <ConnectButton />
    </div>
  )
}

export default Header