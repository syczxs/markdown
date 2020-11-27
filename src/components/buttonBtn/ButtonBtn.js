import React from 'react'
import PropTypes from 'prop-types'
import './ButtonBtn.css'
import newIcon from '../../assets/pic/new.png'
import updateIncon from '../../assets/pic/导入.png'

const BottomBtn = ({ text, colorClass, icon, onBtnClick }) => (
  <button
    type="button"
    className="footer-pic"
    onClick={onBtnClick}
  >

    { text == "新建" &&
      <img src={newIcon}></img>
    }{
      text == "导入" &&
      <img src={updateIncon}></img>
    }
  </button>
)

BottomBtn.propTypes = {
  text: PropTypes.string,
  colorClass: PropTypes.string,
  // icon: PropTypes.object.isRequired,
  onBtnClick: PropTypes.func
}

BottomBtn.defaultProps = {
  text: '新建'
}
export default BottomBtn