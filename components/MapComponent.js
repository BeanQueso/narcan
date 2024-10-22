import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

const MapComponent = ({ initialRegion, locations }) => {
  console.log("MapComponent rendering with locations:", locations);

  return (
    <View style={styles.container}>
      <Text>Map Component Loaded</Text>
      <MapView
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {locations.map((location, index) => (
          <Marker
            key={index}
            coordinate={{
              latitude: parseFloat(location.Latitude),
              longitude: parseFloat(location.Longitude),
            }}
            title={location['Facility Name']}
            description={location.Address}
          />
        ))}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default MapComponent;
