import React from 'react';
import { Image } from 'expo-image';

const blurhash =
    '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';

type LogoImageProps = {
    source: any;
};

export const LogoImage = ({ source }: LogoImageProps) => {
    return (
        <Image
            source={source}
            style={{
                width: 36,
                height: 36,
                borderRadius: 12,
            }}
            contentFit="cover"
            placeholder={{ blurhash }}
            transition={1000}
        />
    );
};
