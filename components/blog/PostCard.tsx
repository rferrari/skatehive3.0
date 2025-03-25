import { Box, Image, Text, Avatar, Flex, Icon, Slider, SliderTrack, SliderFilledTrack, SliderThumb, Button, Link } from '@chakra-ui/react';
import React, { useState, useEffect, useMemo } from 'react';
import { Discussion } from '@hiveio/dhive';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/swiper-bundle.css';
import { FaHeart, FaComment, FaRegHeart } from 'react-icons/fa';
import { getPostDate } from '@/lib/utils/GetPostDate';
import { useAioha } from '@aioha/react-ui';
import { useRouter } from 'next/navigation';
import { getPayoutValue } from '@/lib/hive/client-functions';
import { extractYoutubeLinks, LinkWithDomain, extractImageUrls } from '@/lib/utils/extractImageUrls'; // Import YouTube extraction function

interface PostCardProps {
    post: Discussion;
}

export default function PostCard({ post }: PostCardProps) {
    const { title, author, body, json_metadata, created } = post;
    const postDate = getPostDate(created);

    // Use useMemo to parse JSON only when json_metadata changes
    const metadata = useMemo(() => {
        try {
            return JSON.parse(json_metadata);
        } catch (e) {
            console.error("Error parsing JSON metadata", e);
            return {};
        }
    }, [json_metadata]);

    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [youtubeLinks, setYoutubeLinks] = useState<LinkWithDomain[]>([]);
    const [sliderValue, setSliderValue] = useState(100);
    const [showSlider, setShowSlider] = useState(false);
    const { aioha, user } = useAioha();
    const [voted, setVoted] = useState(post.active_votes?.some(item => item.voter === user));
    const router = useRouter();
    const default_thumbnail = 'https://images.hive.blog/u/' + author + '/avatar/large';
    const [visibleImages, setVisibleImages] = useState<number>(3);

    useEffect(() => {
        let images: string[] = [];
        if (metadata.image) {
            images = Array.isArray(metadata.image) ? metadata.image : [metadata.image];
        }
        // Extract additional images from markdown content
        const markdownImages = extractImageUrls(body);
        images = images.concat(markdownImages);

        if (images.length > 0) {
            setImageUrls(images);
        } else {
            const ytLinks = extractYoutubeLinks(body);
            if (ytLinks.length > 0) {
                setYoutubeLinks(ytLinks);
                setImageUrls([]);
            } else {
                console.log(post.author, imageUrls, images, metadata);
                setImageUrls([default_thumbnail]);
            }
        }
    }, [body, metadata, default_thumbnail]);

    function handleHeartClick() {
        setShowSlider(!showSlider);
    }

    async function handleVote() {
        const vote = await aioha.vote(post.author, post.permlink, sliderValue * 100);
        setVoted(vote.success);
        handleHeartClick();
    }

    function viewPost() {
        router.push('/@' + author + '/' + post.permlink);
    }

    // **Function to load more slides**
    function handleSlideChange(swiper: any) {
        // Check if user is reaching the end of currently visible images
        if (swiper.activeIndex === visibleImages - 1 && visibleImages < imageUrls.length) {
            setVisibleImages((prev) => Math.min(prev + 3, imageUrls.length)); // Load 3 more slides
        }
    }

    // Modified to only stop propagation
    function stopPropagation(e: React.MouseEvent) {
        e.stopPropagation();
    }

    // Create a proper handler for Swiper click events
    function handleSwiperClick(swiper: any, event: MouseEvent | TouchEvent | PointerEvent) {
        // Stop the event from bubbling up to the card
        event.stopPropagation();
    }

    // New function to log image load errors
    function handleImageError(e: React.SyntheticEvent<HTMLImageElement, Event>) {
        console.error("Failed to load image:", e.currentTarget.src, e);
    }

    return (
        <>
            <style jsx global>{`
                .custom-swiper {
                    --swiper-navigation-color: var(--chakra-colors-primary);
                    --swiper-pagination-color: var(--chakra-colors-primary);
                }

                .custom-swiper .swiper-button-next::after,
                .custom-swiper .swiper-button-prev::after {
                    font-size: 20px;
                }

                .custom-swiper .swiper-pagination-bullet {
                    width: 6px;
                    height: 6px;
                    border-radius: 0; /* Make the dots squared */
                }
            `}</style>
            <Box
                boxShadow={'sm'}
                border="tb1"
                borderRadius="base"
                overflow="hidden"
                bg="muted"
                p={4}
                display="flex"
                flexDirection="column"
                justifyContent="space-between"
                height="100%"
                cursor="pointer"
                _hover={{ boxShadow: 'xl' }}
                position="relative"
            >
                <Flex justifyContent="space-between" alignItems="center" onClick={viewPost}>
                    <Flex alignItems="center">
                        <Avatar size="sm" name={author} src={`https://images.hive.blog/u/${author}/avatar/sm`} />
                        <Box ml={3}>
                            <Text fontWeight="medium" fontSize="sm">
                                <Link href={`/@${author}`} onClick={stopPropagation}>@{author}</Link>
                            </Text>
                            <Text fontSize="sm" color="primary">
                                {postDate}
                            </Text>
                        </Box>
                    </Flex>
                </Flex>
                <Text
                    fontWeight="bold"
                    fontSize="lg"
                    textAlign="left"
                    mb={2}
                    isTruncated
                    onClick={viewPost}
                >
                    {title}
                </Text>

                <Box flex="1" display="flex" alignItems="flex-end" justifyContent="center" zIndex={999}>
                    {imageUrls.length > 0 ? (
                        <Swiper
                            spaceBetween={10}
                            slidesPerView={1}
                            pagination={{ clickable: true }}
                            navigation={true}
                            modules={[Navigation, Pagination]}
                            onSlideChange={handleSlideChange}
                            onClick={handleSwiperClick} // Add this line to handle Swiper clicks
                            className="custom-swiper"
                        >
                            {imageUrls.slice(0, visibleImages).map((url, index) => (
                                // Add the stopPropagation to each SwiperSlide instead
                                <SwiperSlide key={index} onClick={stopPropagation}>
                                    <Box h="200px" w="100%">
                                        <Image
                                            src={url}
                                            alt={title}
                                            borderRadius="base"
                                            objectFit="cover"
                                            w="100%"
                                            h="100%"
                                            loading="lazy"
                                            onError={handleImageError}
                                        />
                                    </Box>
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    ) : youtubeLinks.length > 0 ? (
                        <Swiper
                            spaceBetween={10}
                            slidesPerView={1}
                            pagination={{ clickable: true }}
                            navigation={true}
                            modules={[Navigation, Pagination]}
                            className="custom-swiper"
                        >
                            {youtubeLinks.map((link, index) => (
                                <SwiperSlide key={index} onClick={stopPropagation}>
                                    <Box h="200px" w="100%">
                                        <iframe
                                            src={link.url}
                                            title={`YouTube video from ${link.domain}`}
                                            width="100%"
                                            height="100%"
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        ></iframe>
                                    </Box>
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    ) : (
                        <Box h="200px" w="100%">
                            <Image
                                src={default_thumbnail}
                                alt="default thumbnail"
                                borderRadius="base"
                                objectFit="cover"
                                w="100%"
                                h="100%"
                                loading="lazy"
                                onError={handleImageError}
                            />
                        </Box>
                    )}
                </Box>

                <Box mt="auto">
                    {showSlider ? (
                        <Flex mt={4} alignItems="center" onClick={stopPropagation}>
                            <Box width="100%" mr={4}>
                                <Slider
                                    aria-label="slider-ex-1"
                                    defaultValue={0}
                                    min={0}
                                    max={100}
                                    value={sliderValue}
                                    onChange={(val) => setSliderValue(val)}
                                >
                                    <SliderTrack>
                                        <SliderFilledTrack />
                                    </SliderTrack>
                                    <SliderThumb cursor="grab" _active={{ cursor: "grabbing" }} />
                                </Slider>
                            </Box>
                            <Button size="xs" onClick={(e) => {
                                e.stopPropagation();
                                handleVote();
                            }} pl={5} pr={5} cursor="pointer">Vote {sliderValue} %</Button>
                            <Button size="xs" onClick={(e) => {
                                e.stopPropagation();
                                handleHeartClick();
                            }} ml={1} cursor="pointer">X</Button>
                        </Flex>
                    ) : (
                        <Flex mt={4} justifyContent="space-between" alignItems="center" onClick={stopPropagation}>
                            <Flex alignItems="center">
                                {voted ? (
                                    <Icon
                                        as={FaHeart}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleHeartClick();
                                        }}
                                        cursor="pointer"
                                    />
                                ) : (
                                    <Icon
                                        as={FaRegHeart}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleHeartClick();
                                        }}
                                        cursor="pointer"
                                    />
                                )}
                                <Text ml={2} fontSize="sm">
                                    {post.active_votes.length}
                                </Text>
                                <Icon as={FaComment} ml={4} cursor="pointer" />
                                <Text ml={2} fontSize="sm">
                                    {post.children}
                                </Text>
                            </Flex>
                            <Text fontWeight="bold" fontSize="sm">
                                ${getPayoutValue(post)}
                            </Text>
                        </Flex>
                    )}
                </Box>
            </Box>
        </>
    );
}
