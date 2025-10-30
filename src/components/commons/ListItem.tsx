import { Divider, Text, View } from '@/components/commons';
import { IconSymbol } from '@/components/os/IconSymbol';
import { IconSymbolName } from '@/components/os/IconSymbolFallback';
import colors from '@/themes/colors';
import { Link, LinkProps } from 'expo-router';
import React from 'react';
import {
  OpaqueColorValue,
  View as RNView,
  TouchableHighlight,
  ViewProps,
} from 'react-native';

interface ListItemProps extends ViewProps {
  leadingIcon?: React.ReactNode;
  href?: LinkProps['href'];
  title?: React.ReactNode;
  hint?: React.ReactNode;
  showActionIcon?: boolean;
  actionIcon?: React.ReactNode;
  actionIconSize?: number;
  description?: React.ReactNode;
  descriptionHint?: React.ReactNode;
  metadata?: React.ReactNode;
  metadataHint?: React.ReactNode;
  showDivider?: boolean;
  dividerStartSpace?: number;
  showLinkIcon?: boolean;
  density?: 'condensed' | 'compact' | 'relaxed';
}

// ------------------------------------------------------------------

type SystemImageProps =
  | IconSymbolName
  | {
      name: IconSymbolName;
      color?: OpaqueColorValue;
      size?: number;
    };

function LinkChevronIcon({
  href,
  systemImage,
}: {
  href?: any;
  systemImage?: SystemImageProps;
}) {
  const isHrefExternal =
    typeof href === 'string' && /^([\w\d_+.-]+:)?\/\//.test(href);

  const size = process.env.EXPO_OS === 'ios' ? 16 : 24;

  if (systemImage && typeof systemImage !== 'string') {
    return (
      <IconSymbol
        name={systemImage.name}
        size={systemImage.size ?? size}
        color={systemImage.color ?? colors['system-icon']}
      />
    );
  }

  const resolvedName =
    typeof systemImage === 'string'
      ? systemImage
      : isHrefExternal
      ? 'arrow.up.right'
      : 'chevron.right';

  return (
    <IconSymbol
      name={resolvedName as IconSymbolName}
      size={size}
      weight='bold'
      color={colors['system-icon']}
    />
  );
}

// ------------------------------------------------------------------

const ListContent = (
  props: Partial<ListItemProps> & { ref?: React.Ref<RNView> }
) => {
  const {
    title,
    hint,
    showActionIcon,
    actionIcon,
    actionIconSize = 16,
    description,
    descriptionHint,
    metadata,
    metadataHint,
    showDivider = true,
    dividerStartSpace,
    leadingIcon,
    density = 'condensed',
    showLinkIcon = true,
    ref,
    ...restProps
  } = props;

  // Add a type guard to narrow the element and safely access props.size
  function isIconSymbolElement(
    node: React.ReactNode
  ): node is React.ReactElement<{ size?: number }> {
    return React.isValidElement(node) && node.type === IconSymbol;
  }

  // Get the size from leadingIcon if it's an IconSymbol
  let leadingIconSize = 0;
  if (isIconSymbolElement(leadingIcon)) {
    leadingIconSize = leadingIcon.props.size ?? 16; // Default to 16 if size not specified
  }

  // Priority logic for dividerStartSpace
  const effectiveDividerStartSpace =
    dividerStartSpace ?? (leadingIconSize > 0 ? leadingIconSize + 8 : 0);

  return (
    <RNView
      ref={ref}
      style={{
        flex: 1,
        paddingTop: 8,
        ...(showDivider ? {} : { paddingBottom: 8 }),
      }}
      {...(restProps as any)}
    >
      <RNView style={{ flexDirection: 'row', alignItems: 'center' }}>
        {/* leading icon */}
        {leadingIcon && (
          <RNView style={{ marginRight: 16 }}>{leadingIcon}</RNView>
        )}

        <RNView
          style={{
            flex: 1,
            marginVertical:
              density === 'relaxed' ? 15 : density === 'compact' ? 7 : 12, // 14 condensed default
            gap: 5,
          }}
        >
          {/* main row */}
          {(title || hint) && (
            <View
              style={{
                minWidth: 22,
                gap: 16,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              {typeof title === 'string' ? (
                <Text variant='headline' numberOfLines={1} style={{ flex: 1 }}>
                  {title}
                </Text>
              ) : (
                title
              )}
              {hint && (typeof hint === 'string' ? <Text>{hint}</Text> : hint)}
              {showActionIcon &&
                showLinkIcon &&
                (actionIcon || <LinkChevronIcon />)}
            </View>
          )}

          {/* description */}
          {(description || descriptionHint) && (
            <View
              style={{
                gap: 16,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              {typeof description === 'string' ? (
                <Text
                  variant='subhead'
                  color='secondaryLabel'
                  numberOfLines={1}
                  style={{ flex: 1 }}
                >
                  {description}
                </Text>
              ) : (
                description
              )}

              {descriptionHint &&
                (typeof descriptionHint === 'string' ? (
                  <Text
                    variant='subhead'
                    color='secondaryLabel'
                    style={
                      showActionIcon
                        ? {
                            marginRight: actionIconSize + 8,
                          }
                        : undefined
                    }
                  >
                    {descriptionHint}
                  </Text>
                ) : (
                  descriptionHint
                ))}
            </View>
          )}

          {/* metadata */}
          {(metadata || metadataHint) && (
            <View
              style={{
                gap: 16,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              {typeof metadata === 'string' ? (
                <Text
                  variant='subhead'
                  color='secondaryLabel'
                  numberOfLines={1}
                  style={{ flex: 1 }}
                >
                  {metadata}
                </Text>
              ) : (
                metadata
              )}

              {metadataHint &&
                (typeof metadataHint === 'string' ? (
                  <Text
                    variant='subhead'
                    color='secondaryLabel'
                    style={
                      showActionIcon
                        ? {
                            marginRight: actionIconSize + 8,
                          }
                        : undefined
                    }
                  >
                    {metadataHint}
                  </Text>
                ) : (
                  metadataHint
                ))}
            </View>
          )}
        </RNView>
      </RNView>

      {showDivider && (
        <Divider
          style={{
            marginLeft: effectiveDividerStartSpace,
            paddingBottom: 8,
            marginRight: -1 * 12,
          }}
        />
      )}
    </RNView>
  );
};

ListContent.displayName = 'ListContent';

// ------------------------------------------------------------------

export const ListItem = (
  props: ListItemProps & { ref?: React.Ref<RNView> }
) => {
  const { href, showActionIcon, style, ref, ...rest } = props;
  const isLink = href !== undefined;
  const _showActionIcon = showActionIcon || isLink;
  const content = (
    <ListContent ref={ref} showActionIcon={_showActionIcon} {...rest} />
  );

  const containerStyle = [
    {
      minHeight: 32,
      backgroundColor: 'transparent',
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 12,
    },
    style,
  ];

  if (isLink) {
    const isExternal =
      typeof href === 'string' && /^([\w\d_+.-]+:)?\/\//.test(href);

    return (
      <Link href={href} target={isExternal ? '_blank' : undefined} asChild>
        <TouchableHighlight
          activeOpacity={0.6}
          underlayColor={colors['system-surface']}
        >
          <RNView style={containerStyle}>{content}</RNView>
        </TouchableHighlight>
      </Link>
    );
  }

  return (
    <RNView ref={ref} style={containerStyle} {...(rest as any)}>
      {content}
    </RNView>
  );
};

ListItem.displayName = 'ListItem';
