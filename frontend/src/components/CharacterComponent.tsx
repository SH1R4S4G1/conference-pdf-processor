// CharacterComponent.tsx
import React from 'react';
import { AppStatus } from './../types/types';
import idleIcon from './../../public/icons/idle-icon.png'; 
import processingIcon from './../../public/icons/processing-icon.png';
import completedIcon from './../../public/icons/completed-icon.png';
import errorIcon from './../../public/icons/error-icon.png';
import Image from 'next/image';

const CharacterComponent = ({ status }: { status: AppStatus }) => {
    switch (status) {
      case AppStatus.IDLE:
        return <Image src={idleIcon} alt="Idle" width={150} height={100} />;
      case AppStatus.PROCESSING:
        return <Image src={processingIcon} alt="Processing" width={150} height={100} />;
      case AppStatus.COMPLETED:
        return <Image src={completedIcon} alt="Completed" width={150} height={100} />;
      case AppStatus.ERROR:
        return <Image src={errorIcon} alt="Error" width={150} height={100} />;
    }
  };
  
  export default CharacterComponent;