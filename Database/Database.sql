PGDMP      9                }            postgres    17.2    17.2 8    5           0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                           false            6           0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                           false            7           0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                           false            8           1262    5    postgres    DATABASE     �   CREATE DATABASE postgres WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'English_United States.utf8';
    DROP DATABASE postgres;
                     postgres    false            9           0    0    DATABASE postgres    COMMENT     N   COMMENT ON DATABASE postgres IS 'default administrative connection database';
                        postgres    false    4920            �            1259    24772 
   tbdelivery    TABLE     �   CREATE TABLE public.tbdelivery (
    id integer NOT NULL,
    name character varying(15) NOT NULL,
    price numeric(10,2) NOT NULL
);
    DROP TABLE public.tbdelivery;
       public         heap r       postgres    false            �            1259    24771    paymentmethod_id_seq    SEQUENCE     �   CREATE SEQUENCE public.paymentmethod_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 +   DROP SEQUENCE public.paymentmethod_id_seq;
       public               postgres    false    224            :           0    0    paymentmethod_id_seq    SEQUENCE OWNED BY     J   ALTER SEQUENCE public.paymentmethod_id_seq OWNED BY public.tbdelivery.id;
          public               postgres    false    223            �            1259    24779    tbcart    TABLE     �   CREATE TABLE public.tbcart (
    id integer NOT NULL,
    cart_username character varying(255) NOT NULL,
    cart_productname character varying(255) NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    total_price numeric(10,2) DEFAULT 0.00 NOT NULL
);
    DROP TABLE public.tbcart;
       public         heap r       postgres    false            �            1259    24778    tbcart_id_seq    SEQUENCE     �   CREATE SEQUENCE public.tbcart_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 $   DROP SEQUENCE public.tbcart_id_seq;
       public               postgres    false    226            ;           0    0    tbcart_id_seq    SEQUENCE OWNED BY     ?   ALTER SEQUENCE public.tbcart_id_seq OWNED BY public.tbcart.id;
          public               postgres    false    225            �            1259    24730 
   tbcategory    TABLE     �   CREATE TABLE public.tbcategory (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    photo text NOT NULL
);
    DROP TABLE public.tbcategory;
       public         heap r       postgres    false            �            1259    24729    tbcategory_id_seq    SEQUENCE     �   CREATE SEQUENCE public.tbcategory_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 (   DROP SEQUENCE public.tbcategory_id_seq;
       public               postgres    false    218            <           0    0    tbcategory_id_seq    SEQUENCE OWNED BY     G   ALTER SEQUENCE public.tbcategory_id_seq OWNED BY public.tbcategory.id;
          public               postgres    false    217            �            1259    24753 	   tbproduct    TABLE     �   CREATE TABLE public.tbproduct (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    photo text NOT NULL,
    category_name text,
    price double precision DEFAULT 1.5 NOT NULL
);
    DROP TABLE public.tbproduct;
       public         heap r       postgres    false            �            1259    24752    tbproduct_id_seq    SEQUENCE     �   CREATE SEQUENCE public.tbproduct_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 '   DROP SEQUENCE public.tbproduct_id_seq;
       public               postgres    false    222            =           0    0    tbproduct_id_seq    SEQUENCE OWNED BY     E   ALTER SEQUENCE public.tbproduct_id_seq OWNED BY public.tbproduct.id;
          public               postgres    false    221            �            1259    24802 	   tbreceipt    TABLE     �  CREATE TABLE public.tbreceipt (
    id integer NOT NULL,
    receipt_username character varying(255) NOT NULL,
    receipt_productname character varying(255) NOT NULL,
    quantity integer NOT NULL,
    total_price numeric(10,2) NOT NULL,
    purchase_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    payment_method character varying(50) NOT NULL,
    receipt_code uuid DEFAULT gen_random_uuid(),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
    DROP TABLE public.tbreceipt;
       public         heap r       postgres    false            �            1259    24801    tbreceipt_id_seq    SEQUENCE     �   CREATE SEQUENCE public.tbreceipt_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 '   DROP SEQUENCE public.tbreceipt_id_seq;
       public               postgres    false    228            >           0    0    tbreceipt_id_seq    SEQUENCE OWNED BY     E   ALTER SEQUENCE public.tbreceipt_id_seq OWNED BY public.tbreceipt.id;
          public               postgres    false    227            �            1259    24741    tbuser    TABLE     �   CREATE TABLE public.tbuser (
    id integer NOT NULL,
    name text NOT NULL,
    role text NOT NULL,
    password text NOT NULL,
    failed_attempts integer DEFAULT 0,
    email text
);
    DROP TABLE public.tbuser;
       public         heap r       postgres    false            �            1259    24740    tbuser_id_seq    SEQUENCE     �   CREATE SEQUENCE public.tbuser_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 $   DROP SEQUENCE public.tbuser_id_seq;
       public               postgres    false    220            ?           0    0    tbuser_id_seq    SEQUENCE OWNED BY     ?   ALTER SEQUENCE public.tbuser_id_seq OWNED BY public.tbuser.id;
          public               postgres    false    219            v           2604    24782 	   tbcart id    DEFAULT     f   ALTER TABLE ONLY public.tbcart ALTER COLUMN id SET DEFAULT nextval('public.tbcart_id_seq'::regclass);
 8   ALTER TABLE public.tbcart ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    225    226    226            p           2604    24733    tbcategory id    DEFAULT     n   ALTER TABLE ONLY public.tbcategory ALTER COLUMN id SET DEFAULT nextval('public.tbcategory_id_seq'::regclass);
 <   ALTER TABLE public.tbcategory ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    218    217    218            u           2604    24775    tbdelivery id    DEFAULT     q   ALTER TABLE ONLY public.tbdelivery ALTER COLUMN id SET DEFAULT nextval('public.paymentmethod_id_seq'::regclass);
 <   ALTER TABLE public.tbdelivery ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    224    223    224            s           2604    24756    tbproduct id    DEFAULT     l   ALTER TABLE ONLY public.tbproduct ALTER COLUMN id SET DEFAULT nextval('public.tbproduct_id_seq'::regclass);
 ;   ALTER TABLE public.tbproduct ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    221    222    222            y           2604    24805    tbreceipt id    DEFAULT     l   ALTER TABLE ONLY public.tbreceipt ALTER COLUMN id SET DEFAULT nextval('public.tbreceipt_id_seq'::regclass);
 ;   ALTER TABLE public.tbreceipt ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    227    228    228            q           2604    24744 	   tbuser id    DEFAULT     f   ALTER TABLE ONLY public.tbuser ALTER COLUMN id SET DEFAULT nextval('public.tbuser_id_seq'::regclass);
 8   ALTER TABLE public.tbuser ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    219    220    220            0          0    24779    tbcart 
   TABLE DATA           \   COPY public.tbcart (id, cart_username, cart_productname, quantity, total_price) FROM stdin;
    public               postgres    false    226   �@       (          0    24730 
   tbcategory 
   TABLE DATA           B   COPY public.tbcategory (id, name, description, photo) FROM stdin;
    public               postgres    false    218   A       .          0    24772 
   tbdelivery 
   TABLE DATA           5   COPY public.tbdelivery (id, name, price) FROM stdin;
    public               postgres    false    224   B       ,          0    24753 	   tbproduct 
   TABLE DATA           W   COPY public.tbproduct (id, name, description, photo, category_name, price) FROM stdin;
    public               postgres    false    222   _B       2          0    24802 	   tbreceipt 
   TABLE DATA           �   COPY public.tbreceipt (id, receipt_username, receipt_productname, quantity, total_price, purchase_date, payment_method, receipt_code, created_at) FROM stdin;
    public               postgres    false    228   �N       *          0    24741    tbuser 
   TABLE DATA           R   COPY public.tbuser (id, name, role, password, failed_attempts, email) FROM stdin;
    public               postgres    false    220   �P       @           0    0    paymentmethod_id_seq    SEQUENCE SET     B   SELECT pg_catalog.setval('public.paymentmethod_id_seq', 5, true);
          public               postgres    false    223            A           0    0    tbcart_id_seq    SEQUENCE SET     <   SELECT pg_catalog.setval('public.tbcart_id_seq', 64, true);
          public               postgres    false    225            B           0    0    tbcategory_id_seq    SEQUENCE SET     @   SELECT pg_catalog.setval('public.tbcategory_id_seq', 21, true);
          public               postgres    false    217            C           0    0    tbproduct_id_seq    SEQUENCE SET     ?   SELECT pg_catalog.setval('public.tbproduct_id_seq', 44, true);
          public               postgres    false    221            D           0    0    tbreceipt_id_seq    SEQUENCE SET     ?   SELECT pg_catalog.setval('public.tbreceipt_id_seq', 18, true);
          public               postgres    false    227            E           0    0    tbuser_id_seq    SEQUENCE SET     ;   SELECT pg_catalog.setval('public.tbuser_id_seq', 9, true);
          public               postgres    false    219            �           2606    24777    tbdelivery paymentmethod_pkey 
   CONSTRAINT     [   ALTER TABLE ONLY public.tbdelivery
    ADD CONSTRAINT paymentmethod_pkey PRIMARY KEY (id);
 G   ALTER TABLE ONLY public.tbdelivery DROP CONSTRAINT paymentmethod_pkey;
       public                 postgres    false    224            �           2606    24788    tbcart tbcart_pkey 
   CONSTRAINT     P   ALTER TABLE ONLY public.tbcart
    ADD CONSTRAINT tbcart_pkey PRIMARY KEY (id);
 <   ALTER TABLE ONLY public.tbcart DROP CONSTRAINT tbcart_pkey;
       public                 postgres    false    226            ~           2606    24739    tbcategory tbcategory_name_key 
   CONSTRAINT     Y   ALTER TABLE ONLY public.tbcategory
    ADD CONSTRAINT tbcategory_name_key UNIQUE (name);
 H   ALTER TABLE ONLY public.tbcategory DROP CONSTRAINT tbcategory_name_key;
       public                 postgres    false    218            �           2606    24737    tbcategory tbcategory_pkey 
   CONSTRAINT     X   ALTER TABLE ONLY public.tbcategory
    ADD CONSTRAINT tbcategory_pkey PRIMARY KEY (id);
 D   ALTER TABLE ONLY public.tbcategory DROP CONSTRAINT tbcategory_pkey;
       public                 postgres    false    218            �           2606    24762    tbproduct tbproduct_name_key 
   CONSTRAINT     W   ALTER TABLE ONLY public.tbproduct
    ADD CONSTRAINT tbproduct_name_key UNIQUE (name);
 F   ALTER TABLE ONLY public.tbproduct DROP CONSTRAINT tbproduct_name_key;
       public                 postgres    false    222            �           2606    24760    tbproduct tbproduct_pkey 
   CONSTRAINT     V   ALTER TABLE ONLY public.tbproduct
    ADD CONSTRAINT tbproduct_pkey PRIMARY KEY (id);
 B   ALTER TABLE ONLY public.tbproduct DROP CONSTRAINT tbproduct_pkey;
       public                 postgres    false    222            �           2606    24810    tbreceipt tbreceipt_pkey 
   CONSTRAINT     V   ALTER TABLE ONLY public.tbreceipt
    ADD CONSTRAINT tbreceipt_pkey PRIMARY KEY (id);
 B   ALTER TABLE ONLY public.tbreceipt DROP CONSTRAINT tbreceipt_pkey;
       public                 postgres    false    228            �           2606    24750    tbuser tbuser_name_key 
   CONSTRAINT     Q   ALTER TABLE ONLY public.tbuser
    ADD CONSTRAINT tbuser_name_key UNIQUE (name);
 @   ALTER TABLE ONLY public.tbuser DROP CONSTRAINT tbuser_name_key;
       public                 postgres    false    220            �           2606    24748    tbuser tbuser_pkey 
   CONSTRAINT     P   ALTER TABLE ONLY public.tbuser
    ADD CONSTRAINT tbuser_pkey PRIMARY KEY (id);
 <   ALTER TABLE ONLY public.tbuser DROP CONSTRAINT tbuser_pkey;
       public                 postgres    false    220            �           2606    24800    tbcart unique_cart_entry 
   CONSTRAINT     n   ALTER TABLE ONLY public.tbcart
    ADD CONSTRAINT unique_cart_entry UNIQUE (cart_username, cart_productname);
 B   ALTER TABLE ONLY public.tbcart DROP CONSTRAINT unique_cart_entry;
       public                 postgres    false    226    226            �           2606    24794    tbcart fk_cart_product    FK CONSTRAINT     �   ALTER TABLE ONLY public.tbcart
    ADD CONSTRAINT fk_cart_product FOREIGN KEY (cart_productname) REFERENCES public.tbproduct(name);
 @   ALTER TABLE ONLY public.tbcart DROP CONSTRAINT fk_cart_product;
       public               postgres    false    222    4742    226            �           2606    24789    tbcart fk_cart_user    FK CONSTRAINT     {   ALTER TABLE ONLY public.tbcart
    ADD CONSTRAINT fk_cart_user FOREIGN KEY (cart_username) REFERENCES public.tbuser(name);
 =   ALTER TABLE ONLY public.tbcart DROP CONSTRAINT fk_cart_user;
       public               postgres    false    226    4738    220            �           2606    24816    tbreceipt fk_receipt_product    FK CONSTRAINT     �   ALTER TABLE ONLY public.tbreceipt
    ADD CONSTRAINT fk_receipt_product FOREIGN KEY (receipt_productname) REFERENCES public.tbproduct(name);
 F   ALTER TABLE ONLY public.tbreceipt DROP CONSTRAINT fk_receipt_product;
       public               postgres    false    222    228    4742            �           2606    24811    tbreceipt fk_receipt_user    FK CONSTRAINT     �   ALTER TABLE ONLY public.tbreceipt
    ADD CONSTRAINT fk_receipt_user FOREIGN KEY (receipt_username) REFERENCES public.tbuser(name);
 C   ALTER TABLE ONLY public.tbreceipt DROP CONSTRAINT fk_receipt_user;
       public               postgres    false    228    4738    220            �           2606    24763 &   tbproduct tbproduct_category_name_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.tbproduct
    ADD CONSTRAINT tbproduct_category_name_fkey FOREIGN KEY (category_name) REFERENCES public.tbcategory(name);
 P   ALTER TABLE ONLY public.tbproduct DROP CONSTRAINT tbproduct_category_name_fkey;
       public               postgres    false    4734    222    218            0   6   x�31�,�H,3��,����KW�ML���KU(.IM��44�445�30������ P��      (   �   x��PAN�0<���R�N��WV ���.֮w[�I����{�,\��e�왱��]p�W��u�!����J��D��(�56�[ձ�%�qO�����p�@?����|�Qg���+��hM�6Qc�U&��]�� ϼJ�	v졟Sy�d�;�V�>ibv�.q;��L����<N/c�Hf�6U[��RD���J=�t@2s�F/���>M�ʲ�7~)X4XRm5����?_x)�<���o      .   5   x�3���OI�4�30�2����41�9�B�9�@lSۈ�D�Ԁ+F��� 	�      ,   J  x��Y�r��}������X�@��ԛ.V���͘^;[��!0f�`q�}�'$���[�5��_����,kW��j������ӧό��\YU:k"z�l0���^�L�"qk]tf���R�Qa��8KSZ���64w�V%����4WEE!��4�e��JǴ��:��BS@.���M�����{���^����!�\Ay�*�}<ޙ��6J]�6ԍ2��HE�.K�%��I��Kʱ|魯���)�]mn,��0]y�ﴭ0��/u���]&.�}i�u���!}��-�T�	�8��Ujl�������U��^�0��Z�ư�B��e��I�)�U�]��!����5�}�6xwuEx%��<�Պ�gX�r�,��8P��u�ے�1։*��-���d�����CW��2�L5�a��I������`:>���-�
;�mG�[��H�WX�6erL��\���ʰ��q�@]X��Tɮ��*<�3�^�+x&��_����q�d���`8�0��_����M����*2��`�����rps��k��ҩ�,smKT��ї�ttDttt��Iy��}�������!�( %Ǥ�����"�醣�����v���5>iD)W�A��ܨLz��퍊5�
�~�d���뷱�6�W�hi~ҧ4��Q��/�tysD[a��q����w�I���ð�٘L��q0�G��?~;���S2�F�~磊�:�(��J�Q�l�T�.�u����&���	�H�_�̕1��σ�U�.^ʟ���ݝK+D�����ו�8���}���w�ߙ|
{��\q8��v�%'�o�S���j �o
��C�	×�F���Բ�\��)���b���IT�=�c�.p���tfW\XbY-KW,i��0LMY�P�t`���(rE܂��l����$����x4LO���%^�p �~7�7�W �M�6��4g���H{��KY���ʂ��x�J�b�٫�����'� �y���.�?�7���*��Z�2��k�n	��nu���>��D�*v��W xi�j+�C�|�%�gE���\�v#�tk�Dt6KM�"�7�b:��ث�<x��Q�G��a薨��ͤL�S2F���u�C���?�]0�t�7X�n�!d�&A[�x������;2%n���J�cR1���kiG�Ԫ	��̕���m`�,���5M�3�ř�e!��r���O���H��/tTU�!��%8 ����1:B�%��`S\�UQ�;��ɼ	��\\��j 8R[ւ���<�cךZ�4���By ���0�_ܸA��� Բ��6Wt�DBV���Iظ���RN2\� b� �cyظ�`���UW�=��J�0�}ъc Oޮu,�P�La4s9���!'�� H�Z�d!r)F7�3��bP�,%��B��<q����Hl��
n����5�+�$�`G�$h(��-]����B�V��2������bǶ�
Fy{kW�1�S9md�c��4�N���p�q8�����Y�٢���3�p᱙��_e�U�L���ej�RV���30�[h��x�mO��X�B��3�������j�gE��{�4>��O[gu���<���9Z���ǹ�4c�
��W��:C)?lm���k��_� RV�U�=�Vf��r$o�_�0Z7�e�&5�>�?�v�""�U܂��&�8K@�s�ZoP�1ks����Hj��`Y�L�N�)�-��X7���.rʍ���߆�)!�n���HW-�ˣY~��`TuK��ɛ�3O��킕�Y!-�]��ZV"XH�7Qs���4G��V������gi͛��,M�F��j0����8ʾ�����Q�r|�����H	v��7R����q.����؝n8�߳3�)�s�R����Z�|��3�).͝�-�P�Hڮ
�w�XH��U���"��BD��5�3OF�G�iU� ul�]Cz[By��o��'����lh.^�x��%J i�G_���G	On�f��M�S���P&ˑ�'�,�[Q�A%ld�Ο
�T�����2`yj��R�YZ�9E9��r��q�x�cm�!�x��eg	%��_ĝ�W���V9n��V�7x�w��3���糒� �ݓjv�Mz��ϗ���2=	����OF�W�?|B�8� 5|���:3�VH<�g��y8�O��[�lV�������;���D����,�Θ�I����e�ٶ)��4,��s����)N���N��z4�]
��w#�Io�Be�)@���t��!�<�A���f�j}�)�� ɖ2[��O��-_�h�5_�fQ)c��,�T��P4��x���"��?F4�nS��U��B��.�Pى�F��6�������,� ג�G���ٔ�~��c��[Gn��� �-���1_��8�%P�a0ȲFEqRc}g|����z��8?��7��B�d[9��t���d2M�Q�З��/+h��BoM:�L�S� �-�9�̦!�.z+,<�@fA�ḭx 8�.,�*�P[/>���e�e1�7z�.������\�4��2ٛxPFX����;iI�{��۲u�n���85M�o�~�~@���>�����XU��Y�(�&��(O{ao�L�'��x���}]��n�Ή��G{��sԁ�|��V��L�v�Spk�pj>��R{V���ޕNd��ƙH�����"�[�2��ʩ�TwB�8}��?�W��7������]��3�V��}�!iA�TڣO$o=�X1{���e�q�D��0{3������PwL����B܉�+��p%��5p�S�V�Ϲo�A�U��^C0������5`����wh������W��,�LDM�]��F�2%hC\����5�Aqf_��sl�F\+�ރd,w�����S�m��_� ����S��d���R���9R˿dl�� ��Pҥ�B���]$PaU��t=Ut��[�S��KA�~-���50����K\�2�*�ڗ�>��8O��/��57!,.Lb�g4�i{S%�4�L.��&��?��<�!����J��S:Iy�L.M�+U����FЛ+�K����wGQ���c\�������۫��l�[��P
d�x�q���xz>%H>����=88�k�c�      2   �  x���͎�0��~G3���, �
�T	.{�8Nm>�&��qX�l�PN�->d�'��ټ��ȾS8{�HC<0��� L�4�@�J(Jms���c{:��c^Z�V�����E%!�@�`�}���M�%B��Q�d�׳��a�a�{
�v�|�#���Y5��=�M#��ײ�}+�8�=�m`���\�2I��DU��A�ӎ��N&e��� Nh��p���+])W[__)��<�6�;:l�{����;��̰4���C�Κ��|��s�s|9���㟨=��f>,�U���ɇp9����&ӊ���W�ї���Sʞ�)@U����@�<E�������Е2����Kdx;��0�������n�}���L��(��eϮ54�u��8��1���ا���_��3�s{aZVN���X(�����H�A���YBV�(��2(�R&��_�ǎ|� b���D��٧ϧ.N��b�����v>���[�(T����1ϲ�7�`n      *     x�e�Ks�0��5�ׁ�8tW.�ZD�L7`R�P���m;�۳x��iR\f�����K+N��H�GP������Lr�INs3�ˋ�6����de��!X��T>N8�^$U��k�3V�]�e�V�,�Y�O��"�Zqb�q�'5MB�>D��.�«����|��������3|�����@�������,Tܚ�����i�_�v��lpYׂ{>���7�xڐz��f5�ƃ�Ҩ��ƫv��(;�A
��1*��zL��m�c�O ��ZI|�     