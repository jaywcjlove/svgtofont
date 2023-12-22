import { Text } from 'react-native';

const icons = {"Adobe":"","Demo":"","Git":"","Left":"","Stylelint":""};

export const svgtofont = props => {
  const {name, ...rest} = props;
  return (<Text style={{fontFamily: 'svgtofont', fontSize: 16, color: '#000000', ...rest}}>
    {icons[name]}
  </Text>);
};
