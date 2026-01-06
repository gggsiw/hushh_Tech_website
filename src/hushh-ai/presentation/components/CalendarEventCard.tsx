/**
 * Calendar Event Card Component
 * Displays calendar event information in a rich card format
 */
import { Box, VStack, HStack, Text, Button, Icon } from '@chakra-ui/react';
import { CalendarEventMetadata } from '../../domain/entities';
import { THEME } from '../../core/constants';

interface CalendarEventCardProps {
  event: CalendarEventMetadata;
}

export function CalendarEventCard({ event }: CalendarEventCardProps) {
  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTimeOnly = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <Box
      p={{ base: 3, md: 4 }}
      bg="blue.50"
      borderLeft="4px solid"
      borderLeftColor="blue.500"
      borderRadius={THEME.borderRadius.md}
      mb={2}
      w="full"
      maxW="400px"
    >
      <VStack align="stretch" spacing={3}>
        {/* Event Title */}
        <HStack spacing={2}>
          <Icon viewBox="0 0 24 24" boxSize={5} color="blue.600">
            <path
              fill="currentColor"
              d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V9h14v10zM7 11h5v5H7v-5z"
            />
          </Icon>
          <Text fontWeight="bold" fontSize={{ base: THEME.fontSizes.md, md: THEME.fontSizes.lg }}>
            {event.summary}
          </Text>
        </HStack>

        {/* Date and Time */}
        <HStack spacing={2}>
          <Icon viewBox="0 0 24 24" boxSize={4} color="gray.600">
            <path
              fill="currentColor"
              d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z"
            />
          </Icon>
          <VStack align="start" spacing={0}>
            <Text fontSize={THEME.fontSizes.sm} color={THEME.colors.textSecondary}>
              {formatDate(event.startTime)}
            </Text>
            <Text fontSize={THEME.fontSizes.sm} color={THEME.colors.textSecondary}>
              {formatTimeOnly(event.startTime)} - {formatTimeOnly(event.endTime)}
            </Text>
          </VStack>
        </HStack>

        {/* Description */}
        {event.description && (
          <Text fontSize={THEME.fontSizes.sm} color={THEME.colors.textSecondary}>
            {event.description}
          </Text>
        )}

        {/* Location */}
        {event.location && (
          <HStack spacing={2}>
            <Icon viewBox="0 0 24 24" boxSize={4} color="gray.600">
              <path
                fill="currentColor"
                d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
              />
            </Icon>
            <Text fontSize={THEME.fontSizes.sm} color={THEME.colors.textSecondary}>
              {event.location}
            </Text>
          </HStack>
        )}

        {/* Attendees */}
        {event.attendees && event.attendees.length > 0 && (
          <HStack spacing={2}>
            <Icon viewBox="0 0 24 24" boxSize={4} color="gray.600">
              <path
                fill="currentColor"
                d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"
              />
            </Icon>
            <Text fontSize={THEME.fontSizes.sm} color={THEME.colors.textSecondary} noOfLines={1}>
              {event.attendees.join(', ')}
            </Text>
          </HStack>
        )}

        {/* Google Meet Link */}
        {event.meetLink && (
          <Button
            as="a"
            href={event.meetLink}
            target="_blank"
            rel="noopener noreferrer"
            size={{ base: 'sm', md: 'md' }}
            colorScheme="blue"
            leftIcon={
              <Icon viewBox="0 0 24 24" boxSize={5}>
                <path
                  fill="currentColor"
                  d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"
                />
              </Icon>
            }
            w="full"
            minH={{ base: '44px', md: 'auto' }} // Apple HIG touch target
          >
            Join Google Meet
          </Button>
        )}
      </VStack>
    </Box>
  );
}
