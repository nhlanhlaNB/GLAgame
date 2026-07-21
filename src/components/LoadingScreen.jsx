import logo from '../assets/images/logo.png'
import './LoadingScreen.css'

function LoadingScreen() {
  return (
    <div className="appLoadingScreen">
      <div className="appLoadingCard">
        <img
          src={logo}
          alt="GRIT Lab Africa logo"
          className="appLoadingLogo"
        />

        <div>
          <p className="appLoadingEyebrow">Welcome to</p>
          <h1 className="appLoadingTitle">GRIT Lab Africa</h1>
          <p className="appLoadingText">
            Preparing your AI learning journey...
          </p>
        </div>

        <div className="appLoadingBar">
          <span></span>
        </div>
      </div>
    </div>
  )
}




export default LoadingScreen