import { Text } from 'react-native';

const icons = {"adobe":"","git":"","stylelint":""};

export const svgtofont = ({iconName, ...rest}) => {
  return (<Text style={{fontFamily: 'svgtofont', fontSize: 16, color: '#000000', ...rest}}>
    {icons[iconName]}
  </Text>);
};
