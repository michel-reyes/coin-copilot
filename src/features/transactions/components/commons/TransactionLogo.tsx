import { Transaction } from '@/api/types/apiTypes';
import { View } from '@/components/commons';
import { BankLogo } from '@/features/accounts/components/commons/BankLogo';
import colors from '@/themes/colors';
import { Image } from 'react-native';

export function TransactionLogo({ transaction }: { transaction: Transaction }) {
    let logo = (
        <BankLogo title={transaction.display_name || transaction.payee} />
    );

    const plaidMetadata = transaction.plaid_metadata;
    if (plaidMetadata) {
        const metadata = JSON.parse(plaidMetadata);
        const businessData = metadata.counterparties[0];
        const logoUrl = metadata.logo_url
            ? metadata.logo_url
            : businessData?.logo_url
              ? businessData.logo_url
              : '';

        if (logoUrl) {
            logo = (
                <View
                    style={{
                        width: 36,
                        height: 36,
                        borderCurve: 'continuous',
                        borderRadius: 12,
                        overflow: 'hidden',
                        borderWidth: 1,
                        borderColor: colors['system-border'],
                    }}
                >
                    <Image
                        style={{
                            width: '100%',
                            height: '100%',
                            zIndex: 1,
                            aspectRatio: 1,
                        }}
                        source={{ uri: logoUrl }}
                    />
                </View>
            );
        }
    }

    return logo;
}
