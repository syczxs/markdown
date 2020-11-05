import React from 'react'
import './Loader.css'

const Loader = ({ text='请稍等' }) => (
    <div className='loading-component text-center'>
        <div className='spinner-border text-primary' role='status'>
            <span className='sr-only'>{text}</span>
        </div>
<h5 className='text-primary'>{text}</h5>
    </div>
)
export default Loader
